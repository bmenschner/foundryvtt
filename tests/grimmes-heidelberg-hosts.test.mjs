import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='modules/grimmes-erwachen/data/';
const actors=JSON.parse(fs.readFileSync(root+'actors.json','utf8'));
const journals=JSON.parse(fs.readFileSync(root+'journals.json','utf8'));
const scenes=JSON.parse(fs.readFileSync(root+'scenes.json','utf8'));
const hosts=actors.filter(a=>a.type==='host' && a.flags['grimmes-erwachen'].chapter===3);

test('six Heidelberg hosts have valid IC, unique identities and GM-only source notes',()=>{
  assert.equal(hosts.length,6);
  const expected=['uniklinik','dfb','cocktail','festspiele','agc','sternschutz'].map(k=>'a3-host-'+k);
  assert.deepEqual(hosts.map(h=>h.flags['grimmes-erwachen'].key),expected);
  assert.equal(new Set(actors.map(a=>a._id)).size,actors.length);
  assert.equal(new Set(actors.map(a=>a.flags['grimmes-erwachen'].key)).size,actors.length);
  for(const host of hosts) {
    assert.match(host._id,/^[a-zA-Z0-9]{16}$/);
    assert.equal(host.ownership.default,0);assert.equal(host.prototypeToken.actorLink,true);
    assert.equal(host.flags['grimmes-erwachen'].adaptation,true);
    assert.equal(host.flags['grimmes-erwachen'].sourceHostStats,false);
    assert(host.flags['grimmes-erwachen'].source.includes('S.'));
    assert.deepEqual(Object.values(host.system.matrix.attributes).sort((a,b)=>a-b),[0,1,2,3].map(n=>host.system.rating+n));
    assert.equal(new Set(host.items.map(i=>i._id)).size,host.items.length);
    const ic=host.items.filter(i=>i.type==='software');
    assert.equal(ic.filter(i=>i.system.active).length,1);assert.equal(ic[0].system.multiTypes[0],'patrol');
    for(const [n,item] of ic.entries()) {
      assert.equal(item.system.type,'IC');assert.equal(item.flags['grimmes-erwachen'].deploymentOrder,n);
      assert(['patrol','marker','binder','track','jammer','killer','blaster'].includes(item.system.multiTypes[0]));
    }
    for(const device of host.items.filter(i=>i.type==='gear')) assert.equal(device.system.isElectronicMatrixDevice,true);
    for(const key of host.flags['grimmes-erwachen'].relatedSceneKeys) assert(scenes.some(s=>s.flags['grimmes-erwachen'].key===key));
    assert(!host.system.description.includes('Celine'));
    assert(!host.system.description.includes('Daten und Spuren'));
  }
  assert.equal(hosts.flatMap(h=>h.items.filter(i=>i.type==='software')).length,28);
  assert.equal(hosts.flatMap(h=>h.items.filter(i=>i.type==='gear')).length,12);
});

test('matrix journal and host cross-references resolve and secrets are not publicly shared',()=>{
  const journal=journals.find(j=>j.flags['grimmes-erwachen'].key==='a3-matrix-hosts');
  assert.equal(journal.ownership.default,0);assert.equal(journal.pages.length,8);
  assert.equal(new Set(journal.pages.map(p=>p._id)).size,journal.pages.length);
  const ids={Actor:new Set(actors.map(a=>a._id)),JournalEntry:new Set(journals.map(j=>j._id))};
  for(const document of [...hosts,journal]) {
    for(const [,type,id] of JSON.stringify(document).matchAll(/@UUID\[(Actor|JournalEntry)\.([a-zA-Z0-9]+)\]/g)) assert(ids[type].has(id),`${type}.${id}`);
  }
  assert(journal.pages.every(p=>p.ownership.default===-1));
});
