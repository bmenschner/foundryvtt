import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAdapter,safePath,MODULE_ID} from '../scripts/foundry-adapter.mjs';
import {executeMacro} from '../scripts/runtime.mjs';

function world() {
  const player={id:'player',name:'Player',isGM:false},gm={id:'gm',name:'GM',isGM:true};
  const actor={id:'actor',name:'Runner',isOwner:true,system:{attributes:{willpower:{value:5,max:9},charisma:{value:4}}},testUserPermission:user=>user.id==='player',getRollData(){return this.system;}};
  player.character=actor;
  globalThis.game={user:player,users:new Map([['player',player],['gm',gm]]),actors:new Map([['actor',actor]]),macros:new Map(),settings:{get:(id,key)=>key==='attributeMappings'?'{"WIL":"attributes.willpower"}':'{}'}};
  globalThis.canvas={tokens:{controlled:[{id:'token',name:'Token',actor}],placeables:[]}};
  globalThis.foundry={dice:{Roll:class {constructor(formula){this.formula=formula;}async evaluate(){this.total=4;return this;}}}};
  globalThis.CONST={CHAT_MESSAGE_STYLES:{ROLL:5,OTHER:0,EMOTE:2}};
  const created=[];
  globalThis.CONFIG={ChatMessage:{documentClass:{getSpeaker:()=>({actor:'actor'}),createDocuments:async data=>{created.push(...data);return data;}}}};
  return {actor,player,created};
}
test('attributes support selected, named, maximum, aliases and explicit mappings',async()=>{
  world();const a=createAdapter();
  assert.equal(await a.attribute('selected|willenskraft'),'5');
  assert.equal(await a.attribute('runner|attributes.willpower|max'),'9');
  assert.equal(await a.attribute('WIL'),'5');
  assert.equal(await a.attribute('selected|token_name'),'Token');
  await assert.rejects(a.attribute('selected|missing'),/fehlt/);
  assert.throws(()=>safePath({},'__proto__.secret'),/Ungültiger/);
});
test('unknown whisper recipients never become public messages',async()=>{
  const {created}=world();
  await assert.rejects(executeMacro('/w Nobody Secret [[1d6]]',createAdapter()),/nicht gefunden/);
  assert.equal(created.length,0);
  await executeMacro('/w gm Secret [[1d6]]',createAdapter());
  assert.deepEqual(new Set(created[0].whisper),new Set(['player','gm']));
  assert.equal(created[0].author,'player');
});
test('blind rolls stay blind and only address GMs',async()=>{
  const {created}=world();
  await executeMacro('/sr 1d6',createAdapter());
  assert.equal(created[0].blind,true);assert.deepEqual(created[0].whisper,['gm']);
});
test('no silent permission bypass through actor references or script macros',async()=>{
  const {actor,created}=world();actor.testUserPermission=()=>false;
  await assert.rejects(executeMacro('/r @{selected|WIL}d6>5',createAdapter()),/Leserechte/);
  assert.equal(created.length,0);
  game.macros.set('unsafe',{id:'unsafe',name:'Unsafe',type:'script',canExecute:true,command:'alert(1)'});
  await assert.rejects(executeMacro('#Unsafe',createAdapter()),/Script-Makro/);
  game.macros.get('unsafe').type='chat';game.macros.get('unsafe').canExecute=false;
  await assert.rejects(executeMacro('#Unsafe',createAdapter()),/Ausführungsrechte/);
});
test('ability lookups preserve character context for unqualified attributes',async()=>{
  world();game.macros.set('ability',{id:'ability',name:'Runner|Attack',type:'chat',canExecute:true,command:'/r @{WIL}d6>5'});
  const messages=await executeMacro('%{selected|Attack}',createAdapter());
  assert.equal(messages[0].rolls[0].formula,'5d6cs>=5');
  assert.ok(messages[0].flags[MODULE_ID]);
});
test('missing tracker permissions reject before posting',async()=>{
  const {created}=world();
  await assert.rejects(executeMacro('/r 1d6 &{tracker}',createAdapter()),/Kampf/);
  assert.equal(created.length,0);
});
