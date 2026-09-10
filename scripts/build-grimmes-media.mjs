import fs from 'node:fs';
import crypto from 'node:crypto';
const root='modules/grimmes-erwachen';
const ID='grimmes-erwachen';
const base=`modules/${ID}`;
const read=name=>JSON.parse(fs.readFileSync(`${root}/data/${name}.json`,'utf8'));
const write=(name,data)=>fs.writeFileSync(`${root}/data/${name}.json`,JSON.stringify(data,null,2)+'\n');
const id=key=>crypto.createHash('sha256').update(key).digest('hex').slice(0,16);
const actors=read('actors'),scenes=read('scenes'),journals=read('journals');
for(const actor of actors.filter(a=>a.type==='NPC')) {
  const src=`${base}/assets/portraits/${actor._id}.png`;
  if(!fs.existsSync(src)) throw new Error(`Portrait missing: ${actor.name}`);
  actor.img=src;
  actor.prototypeToken.texture.src=src;
}
const byId=new Map(actors.map(a=>[a._id,a]));
for(const scene of scenes) {
  if(scene.background?.src && !scene.levels?.length) {
    const levelId=id(`level:${scene._id}`);
    scene.levels=[{_id:levelId,name:'Spielplan',background:{src:scene.background.src},flags:{[ID]:{key:'map-level'}}}];
    scene.initialLevel=levelId;
    delete scene.background;
  }
  for(const token of scene.tokens ?? []) {
    const actor=byId.get(token.actorId);
    if(actor?.img.includes('/portraits/')) token.texture.src=actor.img;
  }
}
for(const journal of journals.filter(j=>/^journal-[123]$/.test(j.flags[ID].key))) {
  const chapter=journal.flags[ID].chapter;
  const add=(key,name,src,sort,caption)=>{
    if(journal.pages.some(p=>p.flags?.[ID]?.key===key)) return;
    journal.pages.push({_id:id(key),name,type:'image',src,image:{caption},title:{show:true,level:1},sort,ownership:{default:-1},flags:{[ID]:{key}}});
  };
  add(`chapter-art-${chapter}`,'Illustration – '+journal.name,`${base}/assets/backgrounds/kapitel-${chapter}.jpg`,0,'Stimmungsbild – eigene Illustration');
  if(chapter===1) add('title-art','Grimmes Erwachen – Titelbild',`${base}/assets/backgrounds/titel.png`,1,'Titelbild, 3840 × 2160');
  actors.filter(a=>a.type==='NPC'&&a.flags[ID].chapter===chapter).forEach((a,i)=>add(`portrait-${a._id}`,'Porträt – '+a.name,a.img,10000000+i*10000,'Eigene Interpretation: '+a.name));
}
write('actors',actors);write('scenes',scenes);write('journals',journals);
fs.writeFileSync(`${root}/assets/portraits/README.md`,[
  '# Porträts für Grimmes Erwachen','',
  '71 eigene Interpretationen der NSC, Geister und Kreaturen. Erstellt mit dem integrierten Bildgenerator. Die verwendeten Prompts stehen in [Prompts.json](Prompts.json).','',
  '| Figur | Abenteuer | Datei |','|---|---:|---|',
  ...actors.filter(a=>a.type==='NPC').map(a=>`| ${a.name} | ${a.flags[ID].chapter} | [Porträt](${a._id}.png) |`),'',
].join('\n'));
const manifest=JSON.parse(fs.readFileSync(`${root}/module.json`,'utf8'));manifest.version='1.1.0';fs.writeFileSync(`${root}/module.json`,JSON.stringify(manifest,null,2)+'\n');
console.log('71 portraits, 4 illustrations, native v14 scene levels integrated.');
