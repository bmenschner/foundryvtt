#!/usr/bin/env node
/**
 * get_release_url.js
 *
 * Loggt sich bei foundryvtt.com ein und gibt die Presigned S3-Download-URL
 * für die angegebene Version auf stdout aus.
 *
 * Verwendung: node get_release_url.js <username> <password> <version>
 * Beispiel:   node get_release_url.js myuser mypass 13.351
 *
 * Kein npm install nötig: Das Script läuft direkt im Docker-Build-Schritt
 * vor dem eigentlichen App-Layer, d.h. node_modules sind noch nicht vorhanden.
 * Deshalb werden ausschließlich Node.js-built-ins verwendet.
 *
 * Ablauf (identisch zu felddy/foundryvtt-docker):
 *   1. CSRF-Token von der Startseite holen (CSRF = Pflicht für den Login-POST)
 *   2. Login via POST mit Username, Passwort und CSRF-Token
 *   3. Presigned S3-URL über die JSON-API abrufen
 *      GET /releases/download?build=<build>&platform=node&response_type=json
 *      → Antwort: { url: "https://r2.foundryvtt.com/..." }
 */

'use strict';

const https = require('https');
const { URL, URLSearchParams } = require('url');

const [username, password, version] = process.argv.slice(2);

if (!username || !password || !version) {
  process.stderr.write('Usage: node get_release_url.js <username> <password> <version>\n');
  process.exit(1);
}

// Build-Nummer aus Version extrahieren (z.B. "14.359" → "359")
const build = version.split('.').pop();
const BASE = 'https://foundryvtt.com';

/**
 * Einfacher HTTPS-Request mit Cookie-Unterstützung.
 */
function request(method, urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'User-Agent': 'node-fetch',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        ...(opts.headers || {}),
      },
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/**
 * Merged Set-Cookie-Header in einen Cookie-String.
 */
function mergeCookies(headers, existing = '') {
  const map = {};
  if (existing) {
    existing.split('; ').forEach(c => {
      const idx = c.indexOf('=');
      if (idx > 0) map[c.slice(0, idx)] = c.slice(idx + 1);
    });
  }
  const setCookie = headers['set-cookie'] || [];
  setCookie.forEach(c => {
    const [kv] = c.split(';');
    const idx = kv.indexOf('=');
    if (idx > 0) map[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  });
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

/**
 * Extrahiert csrfmiddlewaretoken aus HTML per einfachem Regex.
 * Wir nutzen Node.js-Regex statt grep, weil Alpine Linux BusyBox grep
 * kein -P (Perl-Regex) kennt und dadurch im Docker-Build scheitern würde.
 */
function parseCSRF(html) {
  const m = html.match(/name="csrfmiddlewaretoken"\s+value="([^"]+)"/);
  return m ? m[1] : null;
}

(async () => {
  try {
    // ── Schritt 1: CSRF-Token von Startseite holen ────────────────────────
    process.stderr.write('Schritt 1/3: CSRF-Token holen...\n');
    const r1 = await request('GET', BASE);
    let cookies = mergeCookies(r1.headers);
    const csrf = parseCSRF(r1.body);
    if (!csrf) {
      process.stderr.write('FEHLER: CSRF-Token nicht gefunden.\n');
      process.exit(1);
    }
    process.stderr.write(`  csrf: ${csrf.slice(0, 8)}...\n`);

    // ── Schritt 2: Login ──────────────────────────────────────────────────
    process.stderr.write(`Schritt 2/3: Login als ${username}...\n`);
    const formBody = new URLSearchParams({
      csrfmiddlewaretoken: csrf,
      next: '/',
      username,
      password,
    }).toString();
    const r2 = await request('POST', `${BASE}/auth/login/`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${BASE}/auth/login/`,
        'Origin': BASE,
        'Cookie': cookies,
      },
      body: formBody,
    });
    cookies = mergeCookies(r2.headers, cookies);
    if (!cookies.includes('sessionid')) {
      process.stderr.write('FEHLER: Login fehlgeschlagen – Credentials prüfen.\n');
      process.exit(1);
    }
    process.stderr.write('  Login erfolgreich.\n');

    // ── Schritt 3: Presigned S3-URL via JSON-API abrufen ──────────────────
    // Gleiche API wie felddy/foundryvtt-docker
    process.stderr.write(`Schritt 3/3: Presigned URL für Build ${build}...\n`);
    const apiUrl = `${BASE}/releases/download?build=${build}&platform=node&response_type=json`;
    const r3 = await request('GET', apiUrl, {
      headers: { 'Referer': BASE, 'Cookie': cookies },
    });
    if (r3.status !== 200) {
      process.stderr.write(`FEHLER: API antwortet mit Status ${r3.status}\n`);
      process.stderr.write(`Antwort: ${r3.body.slice(0, 200)}\n`);
      process.exit(1);
    }
    let json;
    try {
      json = JSON.parse(r3.body);
    } catch (e) {
      process.stderr.write(`FEHLER: Ungültige JSON-Antwort: ${r3.body.slice(0, 200)}\n`);
      process.exit(1);
    }
    if (!json.url) {
      process.stderr.write(`FEHLER: Kein 'url'-Feld in Antwort: ${r3.body.slice(0, 200)}\n`);
      process.exit(1);
    }
    process.stderr.write('  Presigned URL erhalten.\n');

    // URL auf stdout (für Shell-Capture: URL=$(...))
    process.stdout.write(json.url);
  } catch (e) {
    process.stderr.write(`FEHLER: ${e.message}\n`);
    process.exit(1);
  }
})();
