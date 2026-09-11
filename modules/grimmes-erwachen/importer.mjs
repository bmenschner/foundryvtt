const ID = 'grimmes-erwachen';
const BASE = `modules/${ID}`;
let busy = false;

async function exclusively(work) {
  if (busy) { ui.notifications.warn('Ein Import oder eine Aktualisierung läuft bereits.'); return; }
  busy = true;
  try { return await work(); } finally { busy = false; }
}

const findScene = (collection, source) => collection.find(s =>
  s.getFlag(ID,'key') === source.flags[ID].key ||
  (source.flags[ID].renderV2Key && s.getFlag(ID,'renderV2Key') === source.flags[ID].renderV2Key));

async function renderedScenes(chapters) {
  const response = await fetch(`${BASE}/assets/rendered-v2/Bibliotheken.json`,{cache:'no-store'});
  if (!response.ok) throw new Error('Kartenverzeichnis fehlt. Bitte das vollständige Modul installieren.');
  const catalog = await response.json();
  return catalog.maps.filter(map=>chapters.includes(Number(map.key.match(/^a([123])-/)?.[1]))).map(map=>{
    if (![map.widthMeters,map.pixelWidth,map.pixelHeight].every(n=>Number.isFinite(n) && n>0) || !/^karten\/[\w-]+\.png$/.test(map.file)) throw new Error(`Ungültige Kartendaten: ${map.key}`);
    const levelId=foundry.utils.randomID(),width=map.sceneDimensions?.width ?? Math.round(map.widthMeters*100);
    const height=map.sceneDimensions?.height ?? Math.round(width*map.pixelHeight/map.pixelWidth);
    if (![width,height].every(n=>Number.isSafeInteger(n) && n>0)) throw new Error(`Ungültige Szenengröße: ${map.key}`);
    return {_id:foundry.utils.randomID(),name:`${map.name} – neue Karte`,width,height,padding:0,
      grid:{type:1,size:100,distance:1,units:'m',alpha:0.18},
      levels:[{_id:levelId,name:'Spielplan',background:{src:`${BASE}/assets/rendered-v2/${map.file}`},flags:{[ID]:{key:'map-level'}}}],initialLevel:levelId,
      tokenVision:false,fogExploration:false,environment:{darknessLevel:0,globalLight:{enabled:true}},
      flags:{[ID]:{key:`rendered:${map.key}`,renderV2Key:map.key,chapter:Number(map.key[1]),needsWallReview:true}}};
  });
}

export async function updateContents({chapters=[1,2,3]}={}) {
  return exclusively(async()=>{
    const imported=await runImportBundle({chapters,withActors:true,withRendered:true});
    const repaired=await runRepairMedia({chapters,withRendered:true});
    ui.notifications.info(`Aktualisiert: ${imported.created.Scene} neue Szenen, ${imported.created.Actor} neue NSC/Hosts. Fehlende Bilder wurden ergänzt. Neue Karten benötigen Wände und Tokenpositionen.`,{permanent:true});
    return {imported,repaired};
  });
}

export function prepareScene(data) {
  const scene = foundry.utils.deepClone(data);
  if (scene.background?.src && !scene.levels?.length) {
    const levelId = foundry.utils.randomID();
    scene.levels = [{_id:levelId,name:'Spielplan',background:{src:scene.background.src},flags:{[ID]:{key:'map-level'}}}];
    scene.initialLevel = levelId;
  }
  delete scene.background;
  return scene;
}

async function checkMedia(paths) {
  const media = [...new Set(paths.filter(path=>path?.startsWith(`${BASE}/assets/`)))];
  for (let i=0;i<media.length;i+=6) await Promise.all(media.slice(i,i+6).map(async path => {
    const response = await fetch(path,{method:'HEAD'});
    if (!response.ok) throw new Error(`Bild fehlt: ${path}. Der Modulordner muss samt assets kopiert sein.`);
  }));
}

const sceneImage = scene => scene.levels?.find(l=>l.background?.src)?.background.src ?? scene.background?.src;
const replaceablePortrait = path => !path || path.startsWith(`${BASE}/assets/tokens/`) || path === 'icons/svg/mystery-man.svg';

export async function repairMedia(options={}) { return exclusively(()=>runRepairMedia(options)); }

async function runRepairMedia({chapters=[1,2,3],withRendered=false}={}) {
  if (!game.user.isGM) throw new Error('Nur für die Spielleitung verfügbar.');
  if (Number(game.release?.generation) !== 14) throw new Error('Die Bildkorrektur benötigt Foundry 14.');
  const report = {scenes:0,actors:0,tokens:0,pages:0};
  try {
    const [actors,journals,scenes] = await Promise.all(['actors','journals','scenes'].map(readData));
    const data = selectDocuments({actors,journals,scenes},chapters,true);
    if (withRendered) data.scenes.push(...await renderedScenes(chapters));
    await checkMedia([...data.scenes.map(sceneImage),...data.actors.map(a=>a.img),...data.journals.flatMap(j=>j.pages.filter(p=>p.type==='image').map(p=>p.src))]);
    const portraits = new Map();
    for (const source of data.actors) {
      const actor = game.actors.find(a=>a.getFlag(ID,'key')===source.flags[ID].key);
      if (!actor || !source.img?.includes('/assets/portraits/')) continue;
      portraits.set(actor.id,source.img);
      const changes = {};
      if (replaceablePortrait(actor.img)) changes.img = source.img;
      if (replaceablePortrait(actor.prototypeToken?.texture?.src)) changes['prototypeToken.texture.src'] = source.img;
      if (Object.keys(changes).length) { await actor.update(changes); report.actors++; }
    }
    for (const source of data.scenes) {
      const scene = findScene(game.scenes,source);
      if (!scene) continue;
      const levels = Array.from(scene.levels ?? []);
      let level = levels.find(l=>l.getFlag?.(ID,'key')==='map-level') ?? scene.initialLevel ?? levels[0];
      if (typeof level === 'string') level = levels.find(l=>l.id===level);
      if (!level && !levels.some(l=>l.background?.src)) {
        [level] = await scene.createEmbeddedDocuments('Level',[{name:'Spielplan',background:{src:sceneImage(source)},flags:{[ID]:{key:'map-level'}}}]);
        await scene.update({initialLevel:level.id});
        report.scenes++;
      } else if (level && !level.background?.src && !levels.some(l=>l.background?.src)) {
        await scene.updateEmbeddedDocuments('Level',[{_id:level.id,'background.src':sceneImage(source)}]);
        report.scenes++;
      }
      const changes = Array.from(scene.tokens ?? []).filter(t=>portraits.has(t.actorId) && replaceablePortrait(t.texture?.src))
        .map(t=>({_id:t.id ?? t._id,'texture.src':portraits.get(t.actorId)}));
      if (changes.length) { await scene.updateEmbeddedDocuments('Token',changes); report.tokens += changes.length; }
    }
    for (const source of data.journals) {
      const journal = game.journal.find(j=>j.getFlag(ID,'key')===source.flags[ID].key);
      if (!journal) continue;
      const pages = source.pages.filter(p=>p.type==='image' && !Array.from(journal.pages).some(old=>old.getFlag?.(ID,'key')===p.flags?.[ID]?.key || old.src===p.src));
      if (pages.length) {
        await journal.createEmbeddedDocuments('JournalEntryPage',pages.map(p=>{const copy=foundry.utils.deepClone(p);delete copy._id;return copy;}));
        report.pages += pages.length;
      }
    }
    ui.notifications.info(`Bilder ergänzt: ${report.scenes} Szenen, ${report.actors} NSC, ${report.tokens} Tokens, ${report.pages} Journalseiten. Eigene Bilder und Spielwerte bleiben erhalten.`,{permanent:true});
    return report;
  } catch(error) {
    ui.notifications.error(`Bildkorrektur gestoppt: ${error.message}. Erneutes Ausführen ist möglich.`,{permanent:true});
    throw error;
  }
}

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
  const response = await fetch(`${BASE}/data/${name}.json`,{cache:'no-store'});
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

export async function importBundle(options={}) { return exclusively(()=>runImportBundle(options)); }

async function runImportBundle({chapters=[1,2,3],withActors=true,withRendered=false}={}) {
  if (!game.user.isGM) throw new Error('Der Import ist nur für die Spielleitung verfügbar.');
  const report = {created:{Actor:0,JournalEntry:0,Scene:0},skipped:{Actor:0,JournalEntry:0,Scene:0},core:game.version,system:game.system.id,systemVersion:game.system.version};
  try {
    const generation = Number(game.release?.generation ?? String(game.version).split('.')[0]);
    if (generation !== 14) throw new Error('Dieses Paket zielt auf Foundry 14. Die UVTT-Karten können unabhängig davon mit einem passenden Universal Battlemap Importer verwendet werden.');
    if (withActors && (game.system.id !== 'shadowrun6-eden' || Number(game.system.version.split('.')[0]) !== 4 || !CONFIG.Actor.dataModels?.host || !CONFIG.Item.dataModels?.software)) {
      throw new Error('NSC und Matrix-Hosts benötigen shadowrun6-eden 4.x mit Host- und Software-Datenmodellen. Zielversion ist 4.0.8.');
    }
    const [actors,journals,scenes] = await Promise.all(['actors','journals','scenes'].map(readData));
    const data = selectDocuments({actors,journals,scenes},chapters,withActors);
    if (withRendered) data.scenes.push(...await renderedScenes(chapters));
    const remap = new Map();
    const sets = [['Actor',data.actors,game.actors,CONFIG.Actor.documentClass],['JournalEntry',data.journals,game.journal,CONFIG.JournalEntry.documentClass],['Scene',data.scenes,game.scenes,CONFIG.Scene.documentClass]];
    // Plan IDs before creating anything, preserving documents from earlier imports.
    const existing = new Map();
    for (const [type,docs,collection] of sets) {
      for (const d of docs) {
        const prior = type === 'Scene' ? findScene(collection,d) : collection.find(v => v.getFlag(ID,'key') === d.flags[ID].key);
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
        const migrated = Class.migrateDataSafe(type === 'Scene' ? prepareScene(candidate) : candidate);
        const temp = new Class(migrated,{temporary:true});
        if (temp.validate({strict:true}) === false) throw new Error(`Ungültige ${type}-Daten: ${d.name}`);
        const normalized = temp.toObject();
        if (type === 'Scene' && sceneImage(normalized) !== sceneImage(d)) throw new Error(`Szenenhintergrund wurde bei der Foundry-Konvertierung verworfen: ${d.name}`);
        prepared.set(`${type}:${d._id}`,normalized);
      }
    }
    await checkMedia([...data.scenes.map(sceneImage),...data.actors.map(a=>a.img),...data.journals.flatMap(j=>j.pages.filter(p=>p.type==='image').map(p=>p.src))]);
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
  }
}

export async function showImporter() {
  if (!game.user.isGM) return;
  const DialogClass = foundry.applications.api.DialogV2;
  const result = await DialogClass.wait({
    window:{title:'Grimmes Erwachen – Import'},
    content:'<p>Foundry 14 / Eden 4.x: 30 taktische Karten (1 m/Kästchen), 4 Hintergründe in 4K/16:9, 71 NSC mit Porträts, 4 Matrix-Hosts und 39 Journals mit Bildseiten.</p><p><strong>Inhalte aktualisieren</strong> ergänzt fehlende NSC, Hosts und Journals sowie 32 neue Karten als separate Szenen (1 m/Kästchen). Bereits per Kartenmakro angelegte Szenen werden erkannt. Fehlende Bilder werden repariert; eigene Bilder und Spielwerte bleiben erhalten. Die neuen Karten haben zunächst keine Wände, Lichter oder Tokens und freie Sicht. Bestehende Grundrisse bleiben erhalten.</p><p><strong>Bereits importiert?</strong> „Bilder ergänzen / reparieren“ ergänzt fehlende Szenenhintergründe, ersetzt die bisherigen Monogramme und fügt Bildseiten hinzu. Eigene Bilder, Spielwerte und Journaltexte bleiben erhalten.</p><p>Der normale Import überspringt bereits vorhandene Dokumente. NSC enthalten eigene SR6-Arbeitswerte; Sonderkräfte werden teilweise am Tisch abgewickelt.</p><label>Abenteuer <select name="chapter"><option value="all">Alle drei Abenteuer</option><option value="1">Spuk in der Wolfsburg</option><option value="2">Zucker für die Kinder</option><option value="3">Ring aus Feuer</option></select></label>',
    buttons:[
      {action:'update',label:'Inhalte aktualisieren',callback:(event,button,dialog)=>({update:true,chapter:dialog.element.querySelector('[name=chapter]').value})},
      {action:'repair',label:'Bilder ergänzen / reparieren',callback:(event,button,dialog)=>({repair:true,chapter:dialog.element.querySelector('[name=chapter]').value})},
      {action:'all',label:'Komplettpaket importieren',callback:(event,button,dialog)=>({chapter:dialog.element.querySelector('[name=chapter]').value,withActors:true})},
      {action:'maps',label:'Nur Szenen und Journals',callback:(event,button,dialog)=>({chapter:dialog.element.querySelector('[name=chapter]').value,withActors:false})}
    ],rejectClose:false
  });
  if (!result) return;
  if (result.update) return updateContents({chapters:result.chapter==='all'?[1,2,3]:[Number(result.chapter)]});
  if (result.repair) return repairMedia({chapters:result.chapter==='all'?[1,2,3]:[Number(result.chapter)]});
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
  game.modules.get(ID).api={showImporter,importBundle,repairMedia,updateContents};
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
