import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='modules/grimmes-erwachen';
const read=name=>JSON.parse(fs.readFileSync(`${root}/data/${name}.json`,'utf8'));
test('every packaged scene has a native v14 background and a 1 m grid',()=>{
  for(const scene of read('scenes')) {
    const level=scene.levels?.find(l=>l._id===scene.initialLevel);
    assert(level?.background?.src,scene.name);
    assert(fs.existsSync(level.background.src),level.background.src);
    assert.equal(scene.background,undefined);
    assert.equal(scene.grid.distance,1);assert.equal(scene.grid.units,'m');
  }
});
test('all 71 NPCs have distinct portrait files and matching token images',()=>{
  const actors=read('actors').filter(a=>a.type==='NPC');assert.equal(actors.length,71);
  assert.equal(new Set(actors.map(a=>a.img)).size,71);
  for(const actor of actors) {
    assert(actor.img.startsWith(`${root}/assets/portraits/`),actor.name);
    assert(fs.existsSync(actor.img),actor.img);
    assert.equal(actor.prototypeToken.texture.src,actor.img);
  }
  const byId=new Map(actors.map(a=>[a._id,a]));
  for(const scene of read('scenes')) for(const token of scene.tokens??[]) {
    if(byId.has(token.actorId)) assert.equal(token.texture.src,byId.get(token.actorId).img);
  }
});
test('chapter journals contain all portrait and background image pages',()=>{
  const pages=read('journals').flatMap(j=>j.pages).filter(p=>p.type==='image');
  assert.equal(pages.length,75);assert.equal(new Set(pages.map(p=>p.flags['grimmes-erwachen'].key)).size,75);
  for(const page of pages) assert(fs.existsSync(page.src),page.src);
});
