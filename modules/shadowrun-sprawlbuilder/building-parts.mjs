import {movablePanel} from './panels.mjs';
const ID='shadowrun-sprawlbuilder';
export const wallLabels={north:'oben',south:'unten',west:'links',east:'rechts'};
export const wallSelection=walls=>Object.fromEntries(Object.keys(wallLabels).map(side=>[side,walls?.[side]!==false]));
const flags=doc=>doc?.flags?.[ID]??{};
const tiles=scene=>Array.from(scene?.tiles?.values?.()??scene?.tiles??[]);
export const groupParts=(scene,group)=>tiles(scene).filter(doc=>group&&flags(doc).buildingVersion===2&&flags(doc).buildingGroup===group);
let interior=null,editor=null,opening=0,registered=false;
export function buildingPartInvisible(doc){
  const data=flags(doc);
  return !!(data.buildingVersion===2&&((doc.hidden&&doc.alpha===0)||
    (globalThis.game?.user?.isGM&&data.buildingPart==='roof'&&interior&&interior.scene===doc.parent&&interior.group===data.buildingGroup)));
}
function refreshGroup(scene,group){for(const doc of groupParts(scene,group)){if(buildingPartInvisible(doc))doc.object?.release?.();doc.object?.renderFlags?.set({refreshState:true});}}
export function setInteriorView(scene,group,enabled){
  if(enabled&&!globalThis.game?.user?.isGM)throw new Error('Nur die Spielleitung kann den Innenraum bearbeiten.');
  const previous=interior;interior=enabled?{scene,group}:null;
  if(previous)refreshGroup(previous.scene,previous.group);
  if(interior)refreshGroup(interior.scene,interior.group);
}
export function closeBuildingEditor(){opening++;editor?.dispose();}
function check(scene){if(!game.user.isGM||Number(game.release?.generation)!==14||!canvas.ready||canvas.scene!==scene)throw new Error('Szene oder Berechtigung geändert. Bitte den Gebäude-Editor neu öffnen.');}
export async function setBuildingWall(scene,group,side,shown){
  check(scene);if(!Object.hasOwn(wallLabels,side))throw new Error('Unbekannte Wandseite.');
  const parts=groupParts(scene,group),wall=parts.find(doc=>flags(doc).buildingPart===`wall-${side}`);
  if(!wall)throw new Error('Dieses Gebäude besitzt kein bearbeitbares Wandteil dieser Seite.');
  if(wall.locked)throw new Error('Diese Wand ist gesperrt. Bitte zuerst die Kachel entsperren.');
  return scene.updateEmbeddedDocuments('Tile',parts.map(doc=>({_id:doc.id,[`flags.${ID}.walls.${side}`]:shown,...(doc.id===wall.id?{hidden:!shown,alpha:shown?1:0}:{})})),{ssbBuildingSync:true});
}
// Alle Teile besitzen denselben Bildrahmen und Anker. Geometrie kann ohne Rundungsdrift übernommen werden.
export function groupTransformUpdates(doc,changes,parts){
  const keys=['x','y','width','height','rotation'];
  if(!keys.some(key=>Object.hasOwn(changes,key)))return [];
  const data=flags(doc);if(data.buildingVersion!==2||!data.buildingGroup)return [];
  const geometry=Object.fromEntries(keys.map(key=>[key,doc[key]??(key==='rotation'?0:undefined)]));
  if(!Object.values(geometry).every(Number.isFinite))return [];
  return parts.filter(other=>other.id!==doc.id&&flags(other).buildingVersion===2&&flags(other).buildingGroup===data.buildingGroup)
    .map(other=>({_id:other.id,...geometry}));
}
export function registerBuildingParts(){
  if(registered)return;registered=true;
  Hooks.on('preCreateTile',(doc,data,options)=>{
    if(flags(doc).buildingVersion===2&&!options?.ssbBuildingCreate&&!options?.isUndo){doc.updateSource({[`flags.${ID}.buildingVersion`]:1,[`flags.${ID}.buildingGroup`]:null});}
  });
  Hooks.on('updateTile',(doc,changes,options,userId)=>{
    if(options?.ssbBuildingSync||!game.user.isGM||userId!==(game.user.id??game.userId)||!doc.parent)return;
    const updates=groupTransformUpdates(doc,changes,groupParts(doc.parent,flags(doc).buildingGroup));
    if(updates.length)doc.parent.updateEmbeddedDocuments('Tile',updates,{ssbBuildingSync:true}).catch(error=>ui.notifications.error(`Gebäudeteile konnten nicht gemeinsam verschoben werden: ${error.message}`));
  });
  Hooks.on('canvasTearDown',()=>{closeBuildingEditor();interior=null;});
}
export async function showBuildingEditor(selectedGroup){
  closeBuildingEditor();const request=opening;
  (await import('./buildings.mjs')).closeBuildings();(await import('./brush.mjs')).closeBrush();(await import('./rows.mjs')).closeRows();
  if(request!==opening)return;
  const scene=canvas.scene;check(scene);
  const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=node('section');panel.className='ssb-building-editor';panel.append(node('strong','SprawlBuilder · Gebäude bearbeiten'));
  const select=node('select');select.setAttribute('aria-label','Gebäude auswählen');
  const status=node('p');status.setAttribute('aria-live','polite');
  const controls=node('fieldset');controls.append(node('legend','Wände anzeigen'));
  const sides=new Map();let busy=false,disposed=false;
  for(const [side,label] of Object.entries(wallLabels)){const wrapper=node('label',label),input=node('input');input.type='checkbox';input.setAttribute('aria-label',`Wand ${label}`);wrapper.prepend(input);controls.append(wrapper);sides.set(side,input);}
  const inside=node('button','Innenraum bearbeiten · nur bei mir');inside.type='button';inside.setAttribute('aria-pressed','false');
  const remove=node('button','Gesamtes Gebäude löschen'),close=node('button','Schließen');
  panel.append(select,controls,inside,node('small','Innenansicht blendet nur dein Dach aus. Boden und Einrichtung bleiben bedienbar. Wände sind Bildteile; Sichtwände setzt du separat.'),status,remove,close);document.body.append(panel);
  const stopMoving=movablePanel(panel,'building-editor',{right:12}),controller=new AbortController(),opts={signal:controller.signal};
  function dispose(){if(disposed)return;disposed=true;stopMoving();controller.abort();for(const [name,id] of hooks)Hooks.off(name,id);if(interior?.scene===scene)setInteriorView(scene,null,false);panel.remove();if(editor?.dispose===dispose)editor=null;}
  const hooks=[['canvasReady',Hooks.on('canvasReady',dispose)],['canvasTearDown',Hooks.on('canvasTearDown',dispose)],['updateTile',Hooks.on('updateTile',doc=>{if(doc.parent===scene&&!busy)sync();})],['deleteTile',Hooks.on('deleteTile',doc=>{if(doc.parent===scene&&!busy)populate();})]];
  editor={dispose};
  function populate(){const before=select.value||selectedGroup;select.replaceChildren();for(const doc of tiles(scene))if(flags(doc).buildingVersion===2&&flags(doc).buildingPart==='floor')select.append(new Option(doc.name,flags(doc).buildingGroup));if([...select.options].some(o=>o.value===before))select.value=before;sync();}
  function sync(){const parts=groupParts(scene,select.value),has=parts.length>0;select.disabled=busy||!has;remove.disabled=inside.disabled=busy||!has;
    for(const [side,input] of sides){const wall=parts.find(doc=>flags(doc).buildingPart===`wall-${side}`);input.checked=!!wall&&!wall.hidden&&wall.alpha!==0;input.disabled=busy||!wall||wall.locked;}
    const editing=interior?.scene===scene&&interior.group===select.value;inside.setAttribute('aria-pressed',String(!!editing));inside.textContent=editing?'Dach wieder anzeigen':'Innenraum bearbeiten · nur bei mir';
    if(!has){status.textContent='Keine neuen Gebäudeteile vorhanden. Ältere Gebäude müssen neu erstellt werden.';if(interior?.scene===scene)setInteriorView(scene,null,false);}}
  select.addEventListener('change',()=>{setInteriorView(scene,null,false);status.textContent='';sync();},opts);
  for(const [side,input] of sides)input.addEventListener('change',async()=>{if(busy)return;busy=true;const shown=input.checked;sync();try{await setBuildingWall(scene,select.value,side,shown);status.textContent=`Wand ${wallLabels[side]} ${shown?'eingeblendet':'ausgeblendet'}.`;}catch(error){status.textContent=error.message;}finally{busy=false;sync();}},opts);
  inside.addEventListener('click',()=>{try{check(scene);setInteriorView(scene,select.value,!(interior?.scene===scene&&interior.group===select.value));sync();}catch(error){status.textContent=error.message;}},opts);
  remove.addEventListener('click',async()=>{if(busy)return;busy=true;sync();try{check(scene);const ids=groupParts(scene,select.value).map(doc=>doc.id);if(ids.length)await scene.deleteEmbeddedDocuments('Tile',ids);setInteriorView(scene,null,false);status.textContent='Gebäude entfernt. Einrichtung bleibt erhalten.';}catch(error){status.textContent=error.message;}finally{busy=false;populate();}},opts);
  close.addEventListener('click',dispose,opts);panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopImmediatePropagation();dispose();}},opts);
  populate();
}
