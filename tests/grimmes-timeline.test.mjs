import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const journals=JSON.parse(fs.readFileSync('modules/grimmes-erwachen/data/journals.json','utf8'));
const handouts=journals.filter(j=>j.flags['grimmes-erwachen'].key.startsWith('a3-timeline-'));
test('timeline has a separate GM document and four privately imported player handouts',()=>{
  assert.equal(handouts.length,5);
  const player=handouts.filter(j=>j.flags['grimmes-erwachen'].audience==='players-on-reveal');
  assert.equal(player.length,4);
  for(const journal of handouts) {
    assert.equal(journal.ownership.default,0);assert.equal(journal.flags['grimmes-erwachen'].chapter,3);
    assert(journal.pages.every(p=>p.ownership.default===-1));
  }
  for(const journal of player) {
    assert.equal(journal.pages.length,1);
    assert(!/Brünhild|Alchera|Felix|Moritz|privat|sechs vermisste|GM-/.test(journal.pages[0].text.content));
  }
  const gm=handouts.find(j=>j.flags['grimmes-erwachen'].audience==='gm');
  assert.equal(gm.pages.length,3);assert(JSON.stringify(gm).includes('vier Stunden'));
  assert.equal(new Set(journals.map(j=>j._id)).size,journals.length);
});
