import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(`modules/grimmes-erwachen/data/${name}.json`,'utf8'));
const actors=read('actors'),journals=read('journals'),updates=read('actor-descriptions');
const chapterActors=actors.filter(a=>a.type==='NPC' && a.flags['grimmes-erwachen'].chapter===3);
const get=key=>journals.find(j=>j.flags['grimmes-erwachen'].key===key);

test('all 28 chapter-3 NPCs have source descriptions and matching GM entries',()=>{
  assert.equal(updates.length,28);assert.equal(new Set(updates.map(u=>u.key)).size,28);
  const main=get('a3-hauptdarsteller');assert.equal(main.pages.length,29);
  for(const actor of chapterActors) {
    const entry=updates.find(u=>u.key===actor.flags['grimmes-erwachen'].key);
    assert(entry);assert.equal(entry.chapter,3);assert.equal(entry.description,actor.system.description);
    assert(entry.previousDescriptions.length);assert(entry.description.includes('Quelle:'));
    const page=main.pages.find(p=>p.name===actor.name);assert(page);
    assert(page.text.content.includes(`@UUID[Actor.${actor._id}]`));
    assert(page.text.content.includes('Hintergrund und Spielleitungswissen'));
  }
});

test('handouts are separate, initially private and have valid links',()=>{
  const handouts=['a3-hauptdarsteller','a3-beinarbeit','a3-krankenakte-ausfuehrlich'].map(get);
  for(const journal of handouts) {
    assert(journal);assert.equal(journal.ownership.default,0);assert.equal(journal.flags['grimmes-erwachen'].chapter,3);
    assert.equal(new Set(journal.pages.map(p=>p._id)).size,journal.pages.length);
    for(const page of journal.pages) {
      assert.equal(page.ownership.default,-1);
      for(const [,type,id] of page.text.content.matchAll(/@UUID\[(Actor|JournalEntry)\.([a-zA-Z0-9]+)\]/g)) assert((type==='Actor'?actors:journals).some(d=>d._id===id));
    }
  }
  const legwork=get('a3-beinarbeit');assert.equal(legwork.pages.length,8);
  assert.equal(legwork.pages.filter(p=>p.text.content.includes('<table>')).length,6);
  assert(legwork.pages[0].text.content.includes('nicht neue SR6-Schwellenwerte'));
  const medical=JSON.stringify(get('a3-krankenakte-ausfuehrlich').pages);
  assert(!/Brünhild|Alchera|Felix|Moritz/.test(medical));
});
