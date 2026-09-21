import {ID,assetPath,tileData} from './catalog.mjs';
import {closeBrush} from './brush.mjs';

export const rowAssets=new Set(['heckensegment','grundmauersegment','mauerrest','entwaesserungsrinne','dachentwaesserung','bordstein-gerade','gehweg-betonplatten']);
let active,opening=0;
const history=[];
export function closeRows(){opening++;active?.dispose();}
export function rowData(asset,{grid,rect,level,start,end,widthMeters=asset.widthMeters}){
  if(!rowAssets.has(asset.key))throw new Error('Dieses Element unterstützt keine Reihen.');
  if(![start?.x,start?.y,end?.x,end?.y].every(Number.isFinite))throw new Error('Ungültige Reihenposition.');
  const base=tileData(asset,{grid,rect,level},widthMeters),[left,top,right,bottom]=asset.alphaBounds;
  const scale=base.width/asset.pixelWidth,length=(right-left)*scale,depth=(bottom-top)*scale;
  const dx=end.x-start.x,dy=end.y-start.y,distance=Math.hypot(dx,dy),angle=distance?Math.atan2(dy,dx):0,c=Math.cos(angle),s=Math.sin(angle);
  const count=Math.max(1,Math.ceil(distance/length-1e-9));
  if(count>128)throw new Error('Höchstens 128 Segmente pro Zug. Bitte kürzere Reihen ziehen.');
  const offsetX=((left+right)/2-asset.pixelWidth/2)*scale,offsetY=((top+bottom)/2-asset.pixelHeight/2)*scale;
  const data=[];
  for(let i=0;i<count;i++){
    const cx=start.x+c*(i+.5)*length,cy=start.y+s*(i+.5)*length;
    for(const x of [-length/2,length/2])for(const y of [-depth/2,depth/2]){
      const px=cx+c*x-s*y,py=cy+s*x+c*y;
      if(px<rect.x-1e-7||py<rect.y-1e-7||px>rect.x+rect.width+1e-7||py>rect.y+rect.height+1e-7)throw new Error('Die vollständige Reihe muss innerhalb der Szene liegen.');
    }
    data.push({...base,x:cx-c*offsetX+s*offsetY,y:cy-s*offsetX-c*offsetY,rotation:(angle*180/Math.PI+360)%360,
      texture:{...base.texture,anchorX:.5,anchorY:.5}});
  }
  return {data,count,lengthMeters:count*widthMeters};
}
function check(scene,level){
  if(!game.user.isGM||Number(game.release?.generation)!==14||!canvas.ready||canvas.scene!==scene||!level?.id||canvas.level?.id!==level.id)throw new Error('Bitte eine Szene und Ebene als Spielleitung in Foundry 14 öffnen. Bei einem Wechsel das Reihenwerkzeug erneut öffnen.');
}
export async function saveRow(asset,options){
  const {scene,level}=options;const valid=()=>{check(scene,level);if(options.cancelled?.())throw new Error('Reihenplatzierung abgebrochen.');};valid();
  const {data}=rowData(asset,{...options,grid:scene.grid});
  const response=await fetch(assetPath(asset),{method:'HEAD'});if(!response.ok)throw new Error('Die Bilddatei fehlt.');valid();
  const group=crypto.randomUUID();for(const tile of data)tile.flags[ID].rowGroup=group;
  const created=await scene.createEmbeddedDocuments('Tile',data);
  if(created?.length)history.push({scene,levelId:level.id,group,ids:created.map(t=>t.id)});
  if(created?.length!==data.length)throw new Error('Reihe nur teilweise angelegt. Rückgängig entfernt die angelegten Teile.');
  return created;
}
export async function undoRow(){
  const scene=canvas.scene,level=canvas.level;check(scene,level);
  const index=history.findLastIndex(h=>h.scene===scene&&h.levelId===level.id);
  if(index<0)throw new Error('Keine eigene Reihe auf dieser Ebene zum Zurücknehmen.');
  const h=history[index],ids=h.ids.filter(id=>scene.tiles.get(id)?.flags?.[ID]?.rowGroup===h.group);
  if(ids.length)await scene.deleteEmbeddedDocuments('Tile',ids);history.splice(index,1);
}
export async function showRows(asset,widthMeters=asset.widthMeters){
  const scene=canvas.scene,level=canvas.level;check(scene,level);
  const rect={...canvas.dimensions.sceneRect};
  // Validate scale and asset before installing the drawing overlay.
  tileData(asset,{grid:scene.grid,rect,level},widthMeters);
  if(!rowAssets.has(asset.key))throw new Error('Dieses Element unterstützt keine Reihen.');
  closeRows();closeBrush();const request=opening;
  const image=new Image();image.src=assetPath(asset);await image.decode();check(scene,level);
  if(request!==opening)return;closeBrush();
  const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=node('section');panel.className='ssb-row-panel';panel.setAttribute('aria-label','Reihe ziehen');
  const status=node('p','Klicken und ziehen. Esc oder Rechtsklick beendet das Werkzeug.');status.setAttribute('aria-live','polite');
  const undo=node('button','Letzte Reihe zurücknehmen'),close=node('button','Schließen');
  panel.append(node('strong',`Reihe · ${asset.name}`),node('span',`${widthMeters} m pro Segment`),status,undo,close);
  const overlay=node('canvas');overlay.className='ssb-row-overlay';document.body.append(overlay,panel);
  let start=null,end=null,pointer=null,busy=false,disposed=false;
  const controller=new AbortController(),opts={signal:controller.signal};
  const dispose=()=>{if(disposed)return;disposed=true;controller.abort();for(const [event,id] of hooks)Hooks.off(event,id);overlay.remove();panel.remove();if(active?.dispose===dispose)active=null;};
  const hooks=[['canvasTearDown',Hooks.on('canvasTearDown',dispose)],['canvasReady',Hooks.on('canvasReady',dispose)],['canvasPan',Hooks.on('canvasPan',()=>{start=end=null;pointer=null;clear();})]];
  active={dispose};
  const clear=()=>overlay.getContext('2d').clearRect(0,0,overlay.width,overlay.height);
  function resize(){overlay.width=innerWidth;overlay.height=innerHeight;start=end=null;pointer=null;clear();}
  resize();window.addEventListener('resize',resize,opts);
  function preview(){
    clear();if(!start||!end)return;
    try{
      check(scene,level);const result=rowData(asset,{grid:scene.grid,rect,level,start,end,widthMeters}),ctx=overlay.getContext('2d');
      const a=canvas.clientCoordinatesFromCanvas({x:0,y:0}),b=canvas.clientCoordinatesFromCanvas({x:1,y:0}),zoom=Math.hypot(b.x-a.x,b.y-a.y);
      for(const tile of result.data){const p=canvas.clientCoordinatesFromCanvas(tile);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(tile.rotation*Math.PI/180);ctx.globalAlpha=.65;ctx.drawImage(image,-tile.width*zoom/2,-tile.height*zoom/2,tile.width*zoom,tile.height*zoom);ctx.restore();}
      status.textContent=`${result.count} Segmente · ${result.lengthMeters.toLocaleString('de',{maximumFractionDigits:2})} m`;
    }catch(error){status.textContent=error.message;}
  }
  const world=e=>canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY});
  overlay.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;e.preventDefault();start=end=world(e);pointer=e.pointerId;overlay.setPointerCapture(pointer);preview();},opts);
  overlay.addEventListener('pointermove',e=>{if(busy)return;if(pointer===null){start=end=world(e);}else if(pointer===e.pointerId)end=world(e);preview();},opts);
  overlay.addEventListener('pointerleave',()=>{if(pointer===null){start=end=null;clear();}},opts);
  overlay.addEventListener('pointercancel',()=>{start=end=null;pointer=null;clear();},opts);
  overlay.addEventListener('pointerup',async e=>{
    if(busy||pointer!==e.pointerId||!start)return;
    const from=start,to=world(e);pointer=null;busy=true;undo.disabled=close.disabled=true;
    try{check(scene,level);await saveRow(asset,{scene,level,rect,start:from,end:to,widthMeters,cancelled:()=>disposed});status.textContent='Reihe gesetzt. Weitere Reihe ziehen oder rückgängig machen.';}
    catch(error){status.textContent=error.message;ui.notifications.error(error.message);}
    finally{busy=false;undo.disabled=close.disabled=false;start=end=null;clear();}
  },opts);
  undo.addEventListener('click',async()=>{if(busy)return;busy=true;undo.disabled=true;try{await undoRow();status.textContent='Letzte Reihe zurückgenommen.';}catch(error){status.textContent=error.message;}finally{busy=false;undo.disabled=false;}},opts);
  close.addEventListener('click',dispose,opts);
  overlay.addEventListener('contextmenu',e=>{e.preventDefault();dispose();},opts);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();dispose();}},{...opts,capture:true});
}
