// Evolved from the supplied 0.1.1 draft. Source text is never rewritten in a Macro document.
export class QueryCancelledError extends Error {
  constructor() { super('Abgebrochen.'); this.name = 'QueryCancelledError'; }
}
export const LIMITS = { length: 100000, depth: 99, queries: 99, messages: 100, dice: 1000 };
export function bounded(text) {
  if (text.length > LIMITS.length) throw new Error('Das Makro ist zu groß.');
  return text;
}
export function normalizeMacroSource(text) {
  return bounded(String(text ?? '').replace(/\r\n?/g, '\n').replace(/\\[ \t]*\n/g, '\n'));
}
export function escapeHTML(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function decodeLegacyEntities(text) {
  return String(text).replace(/&(?:#(\d+)|#x([\da-f]+)|(amp|quot|apos|lt|gt|nbsp));/gi, (raw, dec, hex, named) => {
    if (named) return {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[named.toLowerCase()];
    const code = parseInt(dec ?? hex, dec ? 10 : 16);
    return code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : raw;
  });
}
// Encoded closing braces balance nested query text without splitting the outer query.
function entityClose(source, index) { return source.slice(index).match(/^&#(?:125|x7d);/i)?.[0]; }
export function findFirstQuery(source) {
  const start = source.indexOf('?{');
  if (start < 0) return null;
  let depth = 1;
  for (let i = start + 2; i < source.length; i++) {
    const encoded = entityClose(source, i);
    if (encoded && depth > 1) { depth--; i += encoded.length - 1; continue; }
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return {start, end:i, raw:source.slice(start,i+1), body:source.slice(start+2,i)};
    if (depth > LIMITS.depth) throw new Error('Zu tief verschachtelte Abfrage.');
  }
  throw new SyntaxError('Roll20-Abfrage hat keine schließende Klammer.');
}
export function splitTopLevel(source, delimiter) {
  const parts = []; let start = 0, braces = 0, parens = 0, brackets = 0;
  for (let i = 0; i < source.length; i++) {
    const encoded = entityClose(source, i);
    if (encoded && braces > 0) { braces--; i += encoded.length - 1; continue; }
    const c = source[i];
    if (c === '{') braces++;
    if (c === '}') braces--;
    if (c === '(') parens++;
    if (c === ')') parens--;
    if (c === '[') brackets++;
    if (c === ']') brackets--;
    if (c === delimiter && braces === 0 && parens === 0 && brackets === 0) { parts.push(source.slice(start,i)); start=i+1; }
  }
  parts.push(source.slice(start));
  return parts;
}
export function parseQueryBody(body) {
  const parts = splitTopLevel(body, '|');
  const prompt = decodeLegacyEntities(parts.shift().trim());
  if (parts.length < 2 && !(parts.length && splitTopLevel(parts[0], ',').length > 1)) {
    return {type:'text',prompt,defaultValue:parts[0]?.trim() ?? ''};
  }
  return {type:'select',prompt,options:parts.map(part => {
    const pair = splitTopLevel(part.trim(), ',');
    return {label:decodeLegacyEntities(pair[0]),value:pair.length > 1 ? pair.slice(1).join(',').trim() : part.trim()};
  })};
}
export async function resolveQueries(source, ask, {cache = new Map()} = {}) {
  let text = normalizeMacroSource(source);
  for (let i = 0; i <= LIMITS.queries; i++) {
    const match = findFirstQuery(text);
    if (!match) return text;
    if (i === LIMITS.queries) throw new Error('Zu viele oder rekursive Roll20-Abfragen.');
    const query = parseQueryBody(match.body);
    let answer = cache.get(query.prompt);
    if (!cache.has(query.prompt)) {
      answer = await ask(query);
      if (answer === null || answer === undefined) throw new QueryCancelledError();
      cache.set(query.prompt, String(answer));
    }
    text = bounded(text.slice(0,match.start) + decodeLegacyEntities(answer) + text.slice(match.end+1));
  }
}
async function replaceAsync(text, pattern, replacement) {
  const matches = [...text.matchAll(pattern)];
  let result='',cursor=0;
  for (const match of matches) {
    result=bounded(result+text.slice(cursor,match.index)+await replacement(match));
    cursor=match.index+match[0].length;
  }
  return bounded(result+text.slice(cursor));
}
export async function expandReferences(source, resolver, stack = []) {
  if (stack.length > LIMITS.depth) throw new Error('Zu tief verschachtelte Makroaufrufe.');
  let text = normalizeMacroSource(source);
  const expand = async (kind, name) => {
    const key = `${kind}:${name.toLowerCase()}`;
    if (stack.includes(key)) throw new Error(`Rekursiver Makroaufruf: ${name}`);
    const value = await resolver[kind](name);
    if (value === undefined || value === null) throw new Error(`Nicht gefunden: ${name}`);
    return expandReferences(String(value), resolver, [...stack,key]);
  };
  text = await replaceAsync(text, /%\{([^{}]+)\}/g, m => expand('ability', m[1]));
  text = await replaceAsync(text, /(^|\s)#([^\s{}|,#]+)/g, async m => m[1] + await expand('macro',m[2]));
  text = await replaceAsync(text, /@\{([^{}]+)\}/g, m => expand('attribute',m[1]));
  return text;
}
export function splitMessages(text) {
  return splitTopLevel(text, '\n').map(line=>line.trim()).filter(Boolean);
}
