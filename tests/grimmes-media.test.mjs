import test from 'node:test';
import assert from 'node:assert/strict';
import {repairMedia,prepareScene} from '../modules/grimmes-erwachen/importer.mjs';
const ID='grimmes-erwachen',base=`modules/${ID}/assets`;
const flags=key=>({[ID]:{key,chapter:1}});
const collection=items=>Object.assign(items,{find:Array.prototype.find});
function doc(data) {
  return Object.assign(data,{
    getFlag(scope,key){return this.flags?.[scope]?.[key];},
    async update(changes){for(const [path,value] of Object.entries(changes)){const parts=path.split('.');const last=parts.pop();let obj=this;for(const p of parts) obj=obj[p]??={};obj[last]=value;}return this;},
    async createEmbeddedDocuments(type,items){const prop={Level:'levels',JournalEntryPage:'pages'}[type];this[prop]??=[];const made=items.map((d,i)=>doc({...structuredClone(d),id:`new${this[prop].length+i}`}));this[prop].push(...made);return made;},
    async updateEmbeddedDocuments(type,updates){const prop={Level:'levels',Token:'tokens'}[type];for(const change of updates) await this[prop].find(d=>d.id===change._id).update(change);return updates;}
  });
}
function setup(){
  globalThis.foundry={utils:{deepClone:structuredClone,randomID:()=> '0123456789abcdef'}};
  globalThis.ui={notifications:{info(){},warn(){},error(){}}};
  const actor=doc({id:'actor',flags:flags('actor-key'),img:`${base}/tokens/old.png`,prototypeToken:{texture:{src:`${base}/tokens/old.png`}},system:{body:7}});
  const scene=doc({id:'scene',flags:flags('scene-key'),levels:[doc({id:'empty',background:{src:null}})],tokens:[doc({id:'token',actorId:'actor',texture:{src:`${base}/tokens/old.png`},x:157,y:398})],walls:[{c:[1,2,3,4]}],grid:{distance:1,units:'m'}});
  const journal=doc({id:'journal',flags:flags('journal-key'),pages:[doc({id:'custom',type:'text',text:{content:'Meine Änderungen'}})]});
  globalThis.game={user:{isGM:true},release:{generation:14},actors:collection([actor]),scenes:collection([scene]),journal:collection([journal])};
  const source={actors:[{_id:'actor',flags:flags('actor-key'),img:`${base}/portraits/actor.png`}],scenes:[{_id:'scene',flags:flags('scene-key'),levels:[{background:{src:`${base}/maps/map.webp`}}]}],journals:[{_id:'journal',flags:flags('journal-key'),pages:[{_id:'page',name:'Bild',type:'image',src:`${base}/backgrounds/kapitel-1.jpg`,flags:flags('art')}]}]};
  globalThis.fetch=async(path,opts)=>({ok:true,json:async()=>structuredClone(source[path.match(/(actors|scenes|journals)\.json$/)[1]])});
  return {actor,scene,journal};
}
test('scene conversion explicitly preserves background in a v14 level',()=>{
  setup();const source={background:{src:'map.webp'},grid:{distance:1,units:'m'},tokens:[{x:80}],walls:[{c:[0,0,80,0]}]};
  const scene=prepareScene(source);assert.equal(scene.levels[0].background.src,'map.webp');assert.equal(scene.initialLevel,scene.levels[0]._id);assert.equal(scene.background,undefined);assert.deepEqual(scene.tokens,source.tokens);assert.deepEqual(scene.grid,source.grid);assert.deepEqual(scene.walls,source.walls);assert.equal(source.background.src,'map.webp');
});
test('repair updates media only and is repeatable without duplicates',async()=>{
  const {actor,scene,journal}=setup();
  assert.deepEqual(await repairMedia(),{scenes:1,actors:1,tokens:1,pages:1});
  assert.equal(scene.levels[0].background.src,`${base}/maps/map.webp`);assert.equal(actor.system.body,7);assert.equal(scene.tokens[0].x,157);assert.equal(scene.tokens[0].y,398);assert.equal(journal.pages[0].text.content,'Meine Änderungen');assert.deepEqual(scene.walls,[{c:[1,2,3,4]}]);
  assert.deepEqual(await repairMedia(),{scenes:0,actors:0,tokens:0,pages:0});
});
test('repair preserves custom art and excludes foreign documents',async()=>{
  const {actor,scene}=setup();actor.img='worlds/custom/portrait.png';actor.prototypeToken.texture.src='worlds/custom/token.png';scene.levels[0].background.src='worlds/custom/map.webp';scene.tokens[0].texture.src='worlds/custom/token.png';
  const foreign=doc({id:'foreign',levels:[],tokens:[]});game.scenes.push(foreign);
  const result=await repairMedia();assert.equal(result.scenes,0);assert.equal(result.actors,0);assert.equal(result.tokens,0);assert.equal(actor.img,'worlds/custom/portrait.png');assert.equal(foreign.levels.length,0);
});
test('repair creates absent level and stops before mutations on missing media',async()=>{
  const {scene}=setup();scene.levels=[];assert.equal((await repairMedia()).scenes,1);assert.equal(scene.initialLevel,scene.levels[0].id);
  const fresh=setup();const goodFetch=globalThis.fetch;globalThis.fetch=async(path,opts)=>opts?.method==='HEAD'?{ok:false}:goodFetch(path,opts);
  await assert.rejects(repairMedia(),/Bild fehlt/);assert.equal(fresh.scene.levels[0].background.src,null);assert.equal(fresh.actor.img,`${base}/tokens/old.png`);
});
