import fs from 'node:fs';
import assert from 'node:assert/strict';
import {importBundle,updateContents,selectDocuments,rewriteLinks} from '../modules/grimmes-erwachen/importer.mjs';
const root='modules/';
const bundle=Object.fromEntries(['actors','journals','scenes'].map(k=>[k,JSON.parse(fs.readFileSync(root+'grimmes-erwachen/data/'+k+'.json','utf8'))]));
let seq=0;
class Collection extends Map {find(fn){return [...this.values()].find(fn);} }
function mockClass(collection){return class {
  constructor(d){this.data=structuredClone(d);this.id=d._id;Object.assign(this,structuredClone(d));for(const level of this.levels??[])level.id=level._id;}
  getFlag(scope,key){return this.flags?.[scope]?.[key];}
  async update(changes){for(const [path,value] of Object.entries(changes)){const parts=path.split('.'),last=parts.pop();let obj=this;for(const part of parts)obj=obj[part]??={};obj[last]=value;}return this;}
  async createEmbeddedDocuments(type,docs){const key=type==='Level'?'levels':'pages';this[key]??=[];const made=docs.map(d=>({...structuredClone(d),id:String(++seq)}));this[key].push(...made);return made;}
  async updateEmbeddedDocuments(type,docs){const key=type==='Level'?'levels':'tokens';for(const d of docs){const item=this[key].find(v=>(v.id??v._id)===d._id);for(const [path,value] of Object.entries(d)){if(path==='_id')continue;const parts=path.split('.'),last=parts.pop();let obj=item;for(const part of parts)obj=obj[part]??={};obj[last]=value;}}}
  validate(){return true;}
  toObject(){return structuredClone(this.data);}
  static migrateDataSafe(d){return d;}
  static async create(d){d._id??=String(++seq).padStart(16,'0');const doc=new this(d);collection.set(d._id,doc);return doc;}
};}
function reset(){
  globalThis.game={user:{isGM:true},release:{generation:14},version:'14.367',system:{id:'shadowrun6-eden',version:'4.0.8'},actors:new Collection(),journal:new Collection(),scenes:new Collection(),folders:new Collection()};
  globalThis.CONFIG={Actor:{documentClass:mockClass(game.actors),dataModels:{host:{}}},JournalEntry:{documentClass:mockClass(game.journal)},Scene:{documentClass:mockClass(game.scenes)},Item:{dataModels:{software:{}}}};
  globalThis.Folder=mockClass(game.folders);
  CONFIG.Folder={documentClass:Folder};
  globalThis.ui={notifications:{info:()=>{},warn:()=>{},error:()=>{}}};
  globalThis.foundry={utils:{deepClone:structuredClone,randomID:()=>String(++seq).padStart(16,'0')}};
  globalThis.fetch=async(path)=>{const file=root+path.replace(/^modules\//,'');return {ok:fs.existsSync(file),status:fs.existsSync(file)?200:404,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))};};
}
const log=console.info;console.info=()=>{};
reset();await updateContents();
const timelineHandouts=[...game.journal.values()].filter(j=>j.getFlag('grimmes-erwachen','key')?.startsWith('a3-timeline-'));
assert.equal(timelineHandouts.length,5);
for(const handout of timelineHandouts) game.journal.delete(handout.id);
const timelineBefore={actors:JSON.stringify([...game.actors.values()]),scenes:JSON.stringify([...game.scenes.values()]),journals:JSON.stringify([...game.journal.values()])};
const timelineUpgrade=await updateContents({chapters:[3]});
assert.deepEqual(timelineUpgrade.imported.created,{Actor:0,JournalEntry:5,Scene:0});
assert.equal(JSON.stringify([...game.actors.values()]),timelineBefore.actors);
assert.equal(JSON.stringify([...game.scenes.values()]),timelineBefore.scenes);
assert.equal(JSON.stringify([...game.journal.values()].filter(j=>!j.getFlag('grimmes-erwachen','key')?.startsWith('a3-timeline-'))),timelineBefore.journals);
const editedHandout=game.journal.find(j=>j.getFlag('grimmes-erwachen','key')==='a3-timeline-auftrag');
editedHandout.pages[0].text.content='<p>Unser vereinbartes Honorar</p>';
assert.deepEqual((await updateContents({chapters:[3]})).imported.created,{Actor:0,JournalEntry:0,Scene:0});
assert.equal(editedHandout.pages[0].text.content,'<p>Unser vereinbartes Honorar</p>');
reset();
const first=await importBundle();assert.deepEqual(first.created,{Actor:81,JournalEntry:48,Scene:36});
assert([...game.scenes.values()].every(scene=>scene.levels?.some(level=>level.background?.src)));
const second=await importBundle();assert.deepEqual(second.created,{Actor:0,JournalEntry:0,Scene:0});assert.deepEqual(second.skipped,first.created);
reset();
const original=bundle.actors[0];await CONFIG.Actor.documentClass.create({_id:original._id,name:'Bestehender fremder Actor'});
await importBundle();const replacement=game.actors.find(a=>a.getFlag('grimmes-erwachen','key')===original.flags['grimmes-erwachen'].key);assert.notEqual(replacement.id,original._id);
const tune=game.scenes.find(s=>s.flags['grimmes-erwachen'].key==='a1-01-tune-bar');assert(tune.tokens.some(t=>t.actorId===replacement.id));
assert(game.journal.find(j=>JSON.stringify(j.pages).includes('@UUID[Actor.'+replacement.id+']')));
assert.equal(replacement.img,original.img);
const collisionRetry=await importBundle();assert.deepEqual(collisionRetry.created,{Actor:0,JournalEntry:0,Scene:0});
reset();const partial=await importBundle({chapters:[2],withActors:false});assert.equal(partial.created.Actor,0);assert.equal(partial.created.Scene,11);assert([...game.scenes.values()].every(s=>!(s.tokens?.length)));
reset();const fetchGood=globalThis.fetch;globalThis.fetch=async(path,options)=>options?.method==='HEAD'?{ok:false,status:404}:fetchGood(path,options);
const errorLog=console.error;console.error=()=>{};await assert.rejects(importBundle(),/Bild fehlt/);console.error=errorLog;
assert.equal(game.actors.size+game.journal.size+game.scenes.size+game.folders.size,0);
reset();const SceneClass=CONFIG.Scene.documentClass;CONFIG.Scene.documentClass=class extends SceneClass {toObject(){const data=super.toObject();delete data.levels;delete data.background;return data;}};
console.error=()=>{};await assert.rejects(importBundle(),/Szenenhintergrund wurde/);console.error=errorLog;
assert.equal(game.actors.size+game.journal.size+game.scenes.size+game.folders.size,0);
assert.equal(rewriteLinks('@UUID[Actor.abcdef]',new Map([['abcdef','ghijkl']])),'@UUID[Actor.ghijkl]');
// Update an existing world, including a scene previously imported by the standalone macro.
reset();await importBundle();
const owned=game.actors.find(a=>a.img?.includes('/portraits/'));
owned.img='worlds/custom/me.png';owned.prototypeToken.texture.src='worlds/custom/token.png';owned.system={customStat:99};
const oldScene=game.scenes.find(s=>s.getFlag('grimmes-erwachen','key')==='a1-01-tune-bar');
const oldGeometry=JSON.stringify({levels:oldScene.levels,walls:oldScene.walls,tokens:oldScene.tokens});
const catalog=JSON.parse(fs.readFileSync(root+'grimmes-erwachen/assets/rendered-v2/Bibliotheken.json','utf8'));
const map=catalog.maps[0];
await CONFIG.Scene.documentClass.create({_id:'legacyRendered01',name:'Meine Kartenkopie',flags:{'grimmes-erwachen':{renderV2Key:map.key}},levels:[{_id:'customLevel',background:{src:'worlds/custom/map.webp'}}]});
const missingActor=[...game.actors.values()].find(a=>a.id!==owned.id);game.actors.delete(missingActor.id);
const updated=await updateContents();
assert.equal(updated.imported.created.Scene,31);assert.equal(updated.imported.created.Actor,1);
assert.equal(owned.img,'worlds/custom/me.png');assert.deepEqual(owned.system,{customStat:99});
assert.equal(JSON.stringify({levels:oldScene.levels,walls:oldScene.walls,tokens:oldScene.tokens}),oldGeometry);
assert.equal(game.scenes.get('legacyRendered01').levels[0].background.src,'worlds/custom/map.webp');
const newScenes=[...game.scenes.values()].filter(s=>s.getFlag('grimmes-erwachen','key')?.startsWith('rendered:'));
assert.equal(newScenes.length,31);assert(newScenes.every(s=>s.grid.distance===1 && s.grid.size===100 && s.grid.units==='m' && !s.walls?.length && !s.tokens?.length));
const alchera=game.scenes.find(s=>s.getFlag('grimmes-erwachen','renderV2Key')==='a3-08-alchera');
assert.equal(alchera.width,3376);assert.equal(alchera.height,2701);
assert.equal(alchera.levels[0].background.src,'modules/grimmes-erwachen/assets/rendered-v2/karten/a3-08-alchera-high-detail.png');
assert(game.scenes.find(s=>s.getFlag('grimmes-erwachen','key')==='a3-08-alchera'));
assert.deepEqual((await updateContents()).imported.created,{Actor:0,JournalEntry:0,Scene:0});
const repairScene=newScenes[0];repairScene.levels[0].background.src=null;
assert.equal((await updateContents()).repaired.scenes,1);assert(repairScene.levels[0].background.src.includes('/rendered-v2/karten/'));
// An installed 1.2.2 world lacks the city scenes: update adds them once without touching existing scenes.
const cityScenes=[...game.scenes.values()].filter(s=>s.getFlag('grimmes-erwachen','overview'));
assert.equal(cityScenes.length,2);
for(const city of cityScenes) {
  assert.equal(city.width,3840);assert.equal(city.height,2160);assert.equal(city.grid.type,0);
  assert.equal(city.active,false);assert.equal(city.navigation,false);assert.equal(city.ownership.default,0);
  assert(!city.name.includes('Ring aus Feuer'));
  game.scenes.delete(city.id);
}
assert.deepEqual((await updateContents({chapters:[3]})).imported.created,{Actor:0,JournalEntry:0,Scene:2});
assert.deepEqual((await updateContents({chapters:[3]})).imported.created,{Actor:0,JournalEntry:0,Scene:0});
assert.equal(JSON.stringify({levels:oldScene.levels,walls:oldScene.walls,tokens:oldScene.tokens}),oldGeometry);
// Missing rendered files must stop both import and repair before world changes.
// 1.2.4 world: refresh only untouched shipped descriptions, preserve custom text and every other field.
const descEntries=JSON.parse(fs.readFileSync(root+'grimmes-erwachen/data/actor-descriptions.json','utf8'));
const descActors=descEntries.map(e=>game.actors.find(a=>a.getFlag('grimmes-erwachen','key')===e.key));
for(const [i,actor] of descActors.entries()) actor.system.description=descEntries[i].previousDescriptions[0];
descActors[0].system.description='<p>Meine eigene Beschreibung</p>';
descActors[1].system.description='';
descActors[2].system.notes='<p>Meine vertrauliche Notiz</p>';
const protectedData=actor=>JSON.stringify({system:{...actor.system,description:undefined},img:actor.img,items:actor.items,prototypeToken:actor.prototypeToken});
const beforeDescriptions=descActors.map(protectedData);
const handoutKeys=['a3-hauptdarsteller','a3-beinarbeit','a3-krankenakte-ausfuehrlich'];
for(const key of handoutKeys) game.journal.delete(game.journal.find(j=>j.getFlag('grimmes-erwachen','key')===key).id);
const descriptionUpgrade=await updateContents({chapters:[3]});
assert.deepEqual(descriptionUpgrade.imported.created,{Actor:0,JournalEntry:3,Scene:0});
assert.deepEqual(descriptionUpgrade.descriptions,{updated:27,preserved:1});
assert.equal(descActors[0].system.description,'<p>Meine eigene Beschreibung</p>');
for(let i=1;i<descActors.length;i++) assert.equal(descActors[i].system.description,descEntries[i].description);
assert.deepEqual(descActors.map(protectedData),beforeDescriptions);
const descriptionsAgain=await updateContents({chapters:[3]});
assert.deepEqual(descriptionsAgain.imported.created,{Actor:0,JournalEntry:0,Scene:0});
assert.deepEqual(descriptionsAgain.descriptions,{updated:0,preserved:1});
// Selecting another chapter must not update an old chapter-3 description.
descActors[1].system.description=descEntries[1].previousDescriptions[0];
await updateContents({chapters:[2]});
assert.equal(descActors[1].system.description,descEntries[1].previousDescriptions[0]);
await updateContents({chapters:[3]});
// Upgrade from 1.2.3: add only the six Heidelberg hosts and the new journal.
const heidelbergHostKey = a => a.getFlag('grimmes-erwachen','key')?.startsWith('a3-host-');
const heidelbergHosts = [...game.actors.values()].filter(heidelbergHostKey);
assert.equal(heidelbergHosts.length,6);
for(const host of heidelbergHosts) game.actors.delete(host.id);
const hostJournal = game.journal.find(j=>j.getFlag('grimmes-erwachen','key')==='a3-matrix-hosts');
game.journal.delete(hostJournal.id);
const originalHost=game.actors.find(a=>a.type==='host');
originalHost.system.rating=11;originalHost.items[0].system.active=false;
const customJournal=game.journal.find(j=>j.getFlag('grimmes-erwachen','chapter')===3);
customJournal.pages[0].text={format:1,content:'Eigene Kampagnennotiz'};
const priorActors=JSON.stringify([...game.actors.values()]);
const priorJournals=JSON.stringify([...game.journal.values()]);
const priorScenes=JSON.stringify([...game.scenes.values()]);
assert.deepEqual((await updateContents({chapters:[3]})).imported.created,{Actor:6,JournalEntry:1,Scene:0});
assert.equal(JSON.stringify([...game.actors.values()].filter(a=>!heidelbergHostKey(a))),priorActors);
assert.equal(JSON.stringify([...game.journal.values()].filter(j=>j.getFlag('grimmes-erwachen','key')!=='a3-matrix-hosts')),priorJournals);
assert.equal(JSON.stringify([...game.scenes.values()]),priorScenes);
const addedHost=game.actors.find(heidelbergHostKey);addedHost.system.rating=9;
assert.deepEqual((await updateContents({chapters:[3]})).imported.created,{Actor:0,JournalEntry:0,Scene:0});
assert.equal(addedHost.system.rating,9);
// The new journal must also be usable when a group's chapter-3 import excludes actors.
reset();await importBundle({chapters:[3],withActors:false});
assert.equal(game.actors.size,0);
const noActorJournal=game.journal.find(j=>j.getFlag('grimmes-erwachen','key')==='a3-matrix-hosts');
assert(noActorJournal);assert(!JSON.stringify(noActorJournal.pages).includes('@UUID[Actor.'));
reset();const normalFetch=globalThis.fetch;
globalThis.fetch=async(path,opts)=>opts?.method==='HEAD' && path.includes('/rendered-v2/')?{ok:false}:normalFetch(path,opts);
console.error=()=>{};await assert.rejects(updateContents(),/Bild fehlt/);console.error=errorLog;
assert.equal(game.actors.size+game.journal.size+game.scenes.size+game.folders.size,0);
reset();await updateContents({chapters:[2]});
assert([...game.scenes.values()].every(s=>s.getFlag('grimmes-erwachen','chapter')===2));
assert.equal(game.scenes.size,11+catalog.maps.filter(m=>m.key.startsWith('a2-')).length);
console.info=log;
const report={passed:true,tests:['Vollimport: 81 Actors, 48 Journals, 36 Szenen','Wiederholter Import ohne Duplikate','ID-Kollision: Token und Journalverweise umgebogen','Einzelkapitel ohne Actors','Fehlendes Bild: Abbruch vor Weltänderungen'],scope:'Isolierter Ablauf mit simulierten Foundry-Dokumentklassen; kein Live-Test in Foundry 14.'};

console.log(JSON.stringify(report,null,2));
