import fs from 'node:fs';
import assert from 'node:assert/strict';
import {importBundle,selectDocuments,rewriteLinks} from '../modules/grimmes-erwachen/importer.mjs';
const root='modules/';
const bundle=Object.fromEntries(['actors','journals','scenes'].map(k=>[k,JSON.parse(fs.readFileSync(root+'grimmes-erwachen/data/'+k+'.json','utf8'))]));
let seq=0;
class Collection extends Map {find(fn){return [...this.values()].find(fn);} }
function mockClass(collection){return class {
  constructor(d){this.data=structuredClone(d);this.id=d._id;Object.assign(this,d);}
  getFlag(scope,key){return this.flags?.[scope]?.[key];}
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
reset();
const first=await importBundle();assert.deepEqual(first.created,{Actor:75,JournalEntry:39,Scene:34});
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
console.info=log;
const report={passed:true,tests:['Vollimport: 75 Actors, 39 Journals, 34 Szenen','Wiederholter Import ohne Duplikate','ID-Kollision: Token und Journalverweise umgebogen','Einzelkapitel ohne Actors','Fehlendes Bild: Abbruch vor Weltänderungen'],scope:'Isolierter Ablauf mit simulierten Foundry-Dokumentklassen; kein Live-Test in Foundry 14.'};

console.log(JSON.stringify(report,null,2));
