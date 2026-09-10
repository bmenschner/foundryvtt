const ID = 'grimmes-erwachen';
const BASE = `modules/${ID}`;
let busy = false;

export function rewriteLinks(value, remap) {
  if (typeof value === 'string') {
    if (remap.has(value)) return remap.get(value);
    // Rewrite UUID references, never asset filenames containing the same ID.
    for (const [oldId, newId] of remap) {
      value = value.replace(new RegExp(`((?:Actor|Scene|JournalEntry)\\.)${oldId}(?=[.\\]\\s]|$)`,'g'),`$1${newId}`);
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(v => rewriteLinks(v, remap));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,rewriteLinks(v,remap)]));
  return value;
}

export function selectDocuments(bundle, chapters, withActors) {
  const selected = new Set(chapters);
  const include = d => selected.has(d.flags?.[ID]?.chapter);
  return { actors: withActors ? bundle.actors.filter(include) : [], journals: bundle.journals.filter(include), scenes: bundle.scenes.filter(include) };
}

async function readData(name) {
  const response = await fetch(`${BASE}/data/${name}.json`);
  if (!response.ok) throw new Error(`Datei fehlt: ${name}.json (${response.status}). Modulordner vollständig kopieren.`);
  return response.json();
}

async function ensureFolder(type, chapter, roots) {
  const key = `folder:${type}:${chapter}`;
  let folder = game.folders.find(f => f.type === type && f.getFlag(ID,'key') === key);
  if (folder) return folder.id;
  let root = game.folders.find(f => f.type === type && f.getFlag(ID,'key') === `root:${type}`);
  if (!root) root = await CONFIG.Folder.documentClass.create({name:'Grimmes Erwachen',type,sorting:'m',flags:{[ID]:{key:`root:${type}`}}});
  const names = ['Spuk in der Wolfsburg','Zucker für die Kinder','Ring aus Feuer'];
  folder = await CONFIG.Folder.documentClass.create({name:`0${chapter} – ${names[chapter-1]}`,type,folder:root.id,sorting:'m',color:['#3d879a','#627e48','#a16d3d'][chapter-1],flags:{[ID]:{key}}});
  roots.set(key, folder.id);
  return folder.id;
}

export async function importBundle({chapters=[1,2,3],withActors=true}={}) {
  if (!game.user.isGM) throw new Error('Der Import ist nur für die Spielleitung verfügbar.');
  if (busy) { ui.notifications.warn('Ein Import läuft bereits.'); return; }
  busy = true;
  const report = {created:{Actor:0,JournalEntry:0,Scene:0},skipped:{Actor:0,JournalEntry:0,Scene:0},core:game.version,system:game.system.id,systemVersion:game.system.version};
  try {
    const generation = Number(game.release?.generation ?? String(game.version).split('.')[0]);
    if (generation !== 14) throw new Error('Dieses Paket zielt auf Foundry 14. Die UVTT-Karten können unabhängig davon mit einem passenden Universal Battlemap Importer verwendet werden.');
    if (withActors && (game.system.id !== 'shadowrun6-eden' || Number(game.system.version.split('.')[0]) !== 4 || !CONFIG.Actor.dataModels?.host || !CONFIG.Item.dataModels?.software)) {
      throw new Error('NSC und Matrix-Hosts benötigen shadowrun6-eden 4.x mit Host- und Software-Datenmodellen. Zielversion ist 4.0.8.');
    }
    const [actors,journals,scenes] = await Promise.all(['actors','journals','scenes'].map(readData));
    const data = selectDocuments({actors,journals,scenes},chapters,withActors);
    const remap = new Map();
    const sets = [['Actor',data.actors,game.actors,CONFIG.Actor.documentClass],['JournalEntry',data.journals,game.journal,CONFIG.JournalEntry.documentClass],['Scene',data.scenes,game.scenes,CONFIG.Scene.documentClass]];
    // Plan IDs before creating anything, preserving documents from earlier imports.
    const existing = new Map();
    for (const [type,docs,collection] of sets) {
      for (const d of docs) {
        const prior = collection.find(v => v.getFlag(ID,'key') === d.flags[ID].key);
        if (prior) { remap.set(d._id,prior.id); existing.set(`${type}:${d._id}`,prior); }
        else if (collection.has(d._id)) remap.set(d._id,foundry.utils.randomID());
      }
    }
    if (!withActors) {
      for (const d of data.scenes) d.tokens = [];
      for (const j of data.journals) for (const p of j.pages) {
        if (p.text?.content) p.text.content = p.text.content.replace(/@UUID\[Actor\.[^\]]+\]\{([^}]+)\}/g,'$1 (NSC nicht importiert)');
      }
    }
    // Explicitly migrate legacy scene fields into the installed v14 level structure.
    // Retain the normalized source so validation and creation use identical data.
    const prepared = new Map();
    for (const [type,docs,,Class] of sets) {
      for (const d of docs) {
        if (existing.has(`${type}:${d._id}`)) continue;
        const candidate = rewriteLinks(foundry.utils.deepClone(d),remap);
        candidate.flags[ID].key=d.flags[ID].key;
        const migrated = Class.migrateDataSafe(candidate);
        const temp = new Class(migrated,{temporary:true});
        if (temp.validate({strict:true}) === false) throw new Error(`Ungültige ${type}-Daten: ${d.name}`);
        prepared.set(`${type}:${d._id}`,temp.toObject());
      }
    }
    const media = [...new Set(data.scenes.map(s => s.background.src))];
    for (let i=0;i<media.length;i+=6) {
      await Promise.all(media.slice(i,i+6).map(async path => {
        const r = await fetch(path,{method:'HEAD'});
        if (!r.ok) throw new Error(`Bild fehlt: ${path}. Der Modulordner muss samt assets kopiert sein.`);
      }));
    }
    ui.notifications.info('Grimmes Erwachen: Dateien geprüft, Import startet.');
    const roots=new Map();
    for (const [type,docs,,Class] of sets) {
      for (const d of docs) {
        if (existing.has(`${type}:${d._id}`)) { report.skipped[type]++; continue; }
        const candidate = prepared.get(`${type}:${d._id}`);
        candidate.folder = await ensureFolder(type,d.flags[ID].chapter,roots);
        const created = await Class.create(candidate,{keepId:true,renderSheet:false});
        if (!created) throw new Error(`Anlegen durch Foundry/System abgebrochen: ${d.name}`);
        report.created[type]++;
      }
      ui.notifications.info(`${type}: ${report.created[type]} neu, ${report.skipped[type]} bereits vorhanden.`);
    }
    console.info('Grimmes Erwachen – Importbericht',report);
    ui.notifications.info(`Fertig: ${report.created.Scene} Szenen, ${report.created.Actor} NSC, ${report.created.JournalEntry} Journals. Bestehende Einträge wurden nicht überschrieben.`,{permanent:true});
    return report;
  } catch(error) {
    console.error('Grimmes Erwachen – Importfehler',error,report);
    ui.notifications.error(`Import gestoppt: ${error.message}. Bereits angelegte Einträge bleiben erhalten; ein erneuter Import überspringt sie.`,{permanent:true});
    throw error;
  } finally { busy=false; }
}

export async function showImporter() {
  if (!game.user.isGM) return;
  const DialogClass = foundry.applications.api.DialogV2;
  const result = await DialogClass.wait({
    window:{title:'Grimmes Erwachen – Import'},
    content:'<p>Foundry 14 / Eden 4.x: 30 taktische Karten (1 m/Kästchen), 4 Hintergründe in 4K/16:9, 71 NSC, 4 Matrix-Hosts und 39 Journals.</p><p>NSC enthalten eigene SR6-Arbeitswerte; Sonderkräfte werden teilweise am Tisch abgewickelt. Bestehende importierte Inhalte werden übersprungen.</p><label>Abenteuer <select name="chapter"><option value="all">Alle drei Abenteuer</option><option value="1">Spuk in der Wolfsburg</option><option value="2">Zucker für die Kinder</option><option value="3">Ring aus Feuer</option></select></label>',
    buttons:[
      {action:'all',label:'Komplettpaket importieren',callback:(event,button,dialog)=>({chapter:dialog.element.querySelector('[name=chapter]').value,withActors:true})},
      {action:'maps',label:'Nur Szenen und Journals',callback:(event,button,dialog)=>({chapter:dialog.element.querySelector('[name=chapter]').value,withActors:false})}
    ],rejectClose:false
  });
  if (!result) return;
  return importBundle({chapters:result.chapter==='all'?[1,2,3]:[Number(result.chapter)],withActors:result.withActors});
}

export function registerImporterMenu() {
  class ImporterMenu extends foundry.applications.api.ApplicationV2 {
    render() { showImporter().catch(error=>console.error('Grimmes Erwachen – Import',error)); return this; }
  }
  game.settings.registerMenu(ID,'importer',{
    name:'Grimmes Erwachen',label:'Abenteuer importieren',
    hint:'Importiert Szenen, NSC, Journals und Matrix-Hosts.',
    icon:'fas fa-book-open',type:ImporterMenu,restricted:true
  });
}

export async function initializeImporter() {
  game.modules.get(ID).api={showImporter,importBundle};
  // Only the active GM creates the launcher; importing content is an explicit click.
  if (!game.user.isGM || (game.users.activeGM && game.users.activeGM.id !== game.user.id)) return;
  try {
    if (!game.macros.find(m=>m.getFlag(ID,'key')==='launcher')) {
      await CONFIG.Macro.documentClass.create({name:'Grimmes Erwachen – Import starten',type:'script',img:'icons/svg/book.svg',command:'await game.modules.get("grimmes-erwachen").api.showImporter();',ownership:{default:0},flags:{[ID]:{key:'launcher'}}});
    }
  } catch(error) {
    console.error('Grimmes Erwachen – Startmakro konnte nicht angelegt werden',error);
    ui.notifications.warn('Startmakro konnte nicht angelegt werden. Bitte Spieleinstellungen → Einstellungen konfigurieren → Grimmes Erwachen → Abenteuer importieren verwenden.',{permanent:true});
  }
  ui.notifications.info('Grimmes Erwachen bereit: In Einstellungen konfigurieren → Grimmes Erwachen auf „Abenteuer importieren“ klicken. Alternativ das Startmakro ausführen.',{permanent:true});
}

if (typeof Hooks !== 'undefined') {
  Hooks.once('init',registerImporterMenu);
  Hooks.once('ready',initializeImporter);
}
