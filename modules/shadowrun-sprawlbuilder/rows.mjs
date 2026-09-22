import {stackedTile,stackControls} from './stacking.mjs';
import {snapTargets,snapToEdges,tileRectangle} from './snapping.mjs';
import {ID,assetPath,tileData,loadCatalog,closeCatalog} from './catalog.mjs';
import {closeBrush} from './brush.mjs';

let active,opening=0;
const history=[];
export function closeRows(){opening++;active?.dispose();}
export function rowData(asset,{grid,rect,level,start,end,widthMeters=asset.widthMeters}){
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
export function assetStampData(asset,{grid,rect,level,point,widthMeters=asset.widthMeters,rotation=0}){
  if(![point?.x,point?.y].every(Number.isFinite))throw new Error('Ungültige Stempelposition.');
  const tile=tileData(asset,{grid,rect,level},widthMeters),[left,top,right,bottom]=asset.alphaBounds,scale=tile.width/asset.pixelWidth;
  if(!Number.isFinite(rotation))throw new Error('Ungültiger Drehwinkel.');
  const w=(right-left)*scale,h=(bottom-top)*scale,c=Math.cos(rotation*Math.PI/180),sn=Math.sin(rotation*Math.PI/180);
  for(const x of [-w/2,w/2])for(const y of [-h/2,h/2]){const px=point.x+c*x-sn*y,py=point.y+sn*x+c*y;
    if(px<rect.x-1e-7||py<rect.y-1e-7||px>rect.x+rect.width+1e-7||py>rect.y+rect.height+1e-7)throw new Error('Das sichtbare Element muss innerhalb der Szene liegen.');}
  const ox=((left+right)/2-asset.pixelWidth/2)*scale,oy=((top+bottom)/2-asset.pixelHeight/2)*scale;
  return {...tile,x:point.x-c*ox+sn*oy,y:point.y-sn*ox-c*oy,rotation:((rotation%360)+360)%360,texture:{...tile.texture,anchorX:.5,anchorY:.5}};
}
export async function saveAssetStamp(asset,options){return saveRow(asset,{...options,single:true});}
export async function undoAssetStamp(){return undoRow(true);}
export async function showAssetStamp(asset,widthMeters=asset.widthMeters){return showRows(asset,widthMeters,true);}
function check(scene,level){
  if(!game.user.isGM||Number(game.release?.generation)!==14||!canvas.ready||canvas.scene!==scene||!level?.id||canvas.level?.id!==level.id)throw new Error('Bitte eine Szene und Ebene als Spielleitung in Foundry 14 öffnen. Bei einem Wechsel das Reihenwerkzeug erneut öffnen.');
}
export async function saveRow(asset,options){
  const {scene,level}=options;const valid=()=>{check(scene,level);if(options.cancelled?.())throw new Error('Reihenplatzierung abgebrochen.');};valid();
  const data=options.single?[assetStampData(asset,{...options,grid:scene.grid})]:rowData(asset,{...options,grid:scene.grid}).data;
  const response=await fetch(assetPath(asset),{method:'HEAD'});if(!response.ok)throw new Error('Die Bilddatei fehlt.');valid();
  const group=crypto.randomUUID();for(const tile of data)tile.flags[ID][options.single?'assetStamp':'rowGroup']=group;
  const placed=data.map(tile=>stackedTile(tile,scene.tiles,level.id,{mode:options.stack}));
  const created=await scene.createEmbeddedDocuments('Tile',placed);
  if(created?.length)history.push({scene,levelId:level.id,group,single:!!options.single,ids:created.map(t=>t.id)});
  if(created?.length!==data.length)throw new Error('Reihe nur teilweise angelegt. Rückgängig entfernt die angelegten Teile.');
  return created;
}
export async function undoRow(single=false){
  const scene=canvas.scene,level=canvas.level;check(scene,level);
  const index=history.findLastIndex(h=>h.scene===scene&&h.levelId===level.id&&h.single===single);
  if(index<0)throw new Error(single?'Keine eigene Einzelplatzierung auf dieser Ebene zum Zurücknehmen.':'Keine eigene Reihe auf dieser Ebene zum Zurücknehmen.');
  const h=history[index],ids=h.ids.filter(id=>scene.tiles.get(id)?.flags?.[ID]?.[single?'assetStamp':'rowGroup']===h.group);
  if(ids.length)await scene.deleteEmbeddedDocuments('Tile',ids);history.splice(index,1);
}
export async function showRows(asset,widthMeters=asset.widthMeters,single=false,stackInitial){
  const scene=canvas.scene,level=canvas.level;check(scene,level);
  const rect={...canvas.dimensions.sceneRect};
  // Validate scale and asset before installing the drawing overlay.
  tileData(asset,{grid:scene.grid,rect,level},widthMeters);
  closeRows();closeBrush();const request=opening;
  const image=new Image();image.src=assetPath(asset);await image.decode();
  const assets=new Map((await loadCatalog()).map(a=>[a.key,a]));check(scene,level);
  if(request!==opening)return;closeBrush();
  const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=node('section');panel.className='ssb-row-panel';panel.setAttribute('aria-label',single?'Asset-Stempel':'Reihe ziehen');
  const status=node('p',single?'Klick setzt ein Exemplar. Rechtsklick beendet das Werkzeug; Esc schließt die Galerie.':'Klicken und ziehen. Rechtsklick beendet das Werkzeug; Esc schließt die Galerie.');status.setAttribute('aria-live','polite');
  const undo=node('button',single?'Letzte Platzierung zurücknehmen':'Letzte Reihe zurücknehmen'),close=node('button','Schließen');
  panel.append(node('strong',`${single?'Stempel':'Reihe'} · ${asset.name}`),node('span',single?'':`${widthMeters} m pro Segment`),status,undo,close);
  const size=node('input');size.type='number';size.min='.01';size.max='1000';size.step='.01';size.value=String(widthMeters);size.setAttribute('aria-label','Stempelbreite (m)');
  if(single){const label=node('label','Sichtbare Breite (m)');label.append(size);panel.insertBefore(label,status);}
  const magnet=node('input');magnet.type='checkbox';magnet.checked=true;magnet.setAttribute('aria-label','Kanten einrasten');
  const angle=node('input');angle.type='number';angle.value='0';angle.step='90';angle.setAttribute('aria-label','Drehwinkel (°)');
  if(single){const label=node('label','Kanten einrasten ');label.prepend(magnet);panel.insertBefore(label,status);const labelAngle=node('label','Drehwinkel (°) ');labelAngle.append(angle);panel.insertBefore(labelAngle,status);}
  const stacking=stackControls(stackInitial,()=>preview());panel.insertBefore(stacking.node,status);
  let alt=false,match=null;
  const zoomLevel=()=>{const a=canvas.clientCoordinatesFromCanvas({x:0,y:0}),b=canvas.clientCoordinatesFromCanvas({x:1,y:0});return Math.hypot(b.x-a.x,b.y-a.y);};
  function placement(point){
    if(!magnet.checked||alt){match=null;return {point,rotation:Number(angle.value),match:null};}
    const base=tileData(asset,{grid:scene.grid,rect,level},Number(size.value)),[l,t,r,b]=asset.alphaBounds;
    const result=snapToEdges({point,width:(r-l)*base.width/asset.pixelWidth,height:(b-t)*base.height/asset.pixelHeight,rotation:Number(angle.value),targets:snapTargets(scene.tiles,assets,level.id),zoom:zoomLevel(),previous:match?.key});match=result.match;return result;
  }
  const row=node('button','Reihe ziehen');
  if(single){panel.insertBefore(row,undo);row.addEventListener('click',()=>{if(!busy)showRows(asset,Number(size.value),false,stacking.read()).catch(error=>ui.notifications.error(error.message));});}
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
      check(scene,level);const result=single?{data:[assetStampData(asset,{grid:scene.grid,rect,level,...placement(end),widthMeters:Number(size.value)})]}:rowData(asset,{grid:scene.grid,rect,level,start,end,widthMeters}),ctx=overlay.getContext('2d');
      const staged=result.data.map(t=>stackedTile(t,scene.tiles,level.id,{mode:stacking.read()}));stacking.show(staged.map(t=>t.flags[ID].stack.step));
      const a=canvas.clientCoordinatesFromCanvas({x:0,y:0}),b=canvas.clientCoordinatesFromCanvas({x:1,y:0}),zoom=Math.hypot(b.x-a.x,b.y-a.y);
      for(const tile of result.data){const p=canvas.clientCoordinatesFromCanvas(tile);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(tile.rotation*Math.PI/180);ctx.globalAlpha=.65;ctx.drawImage(image,-tile.width*zoom/2,-tile.height*zoom/2,tile.width*zoom,tile.height*zoom);ctx.restore();}
      if(single&&match)for(const contact of [match,match.secondary].filter(Boolean)){const [a,b]=contact.edge.map(p=>canvas.clientCoordinatesFromCanvas(p));ctx.strokeStyle='#ffd166';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      status.textContent=single?(match?'Kante eingerastet · Alt für freie Platzierung.':'Klick setzt ein Exemplar.'):`${result.count} Segmente · ${result.lengthMeters.toLocaleString('de',{maximumFractionDigits:2})} m`;
    }catch(error){status.textContent=error.message;}
  }
  size.addEventListener('input',()=>{match=null;preview();},opts);angle.addEventListener('input',()=>{match=null;preview();},opts);magnet.addEventListener('change',()=>{match=null;preview();},opts);
  for(const event of ['keydown','keyup'])document.addEventListener(event,e=>{if(e.key==='Alt'){alt=event==='keydown';preview();}},opts);
  window.addEventListener('blur',()=>{alt=false;match=null;start=end=null;pointer=null;clear();},opts);
  const world=e=>canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY});
  overlay.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;e.preventDefault();alt=e.altKey;start=end=world(e);pointer=e.pointerId;overlay.setPointerCapture(pointer);preview();},opts);
  overlay.addEventListener('pointermove',e=>{if(busy)return;alt=e.altKey;if(pointer===null){start=end=world(e);}else if(pointer===e.pointerId)end=world(e);preview();},opts);
  overlay.addEventListener('pointerleave',()=>{if(pointer===null){start=end=null;clear();}},opts);
  overlay.addEventListener('pointercancel',()=>{start=end=null;pointer=null;clear();},opts);
  overlay.addEventListener('pointerup',async e=>{
    if(e.button!==0||busy||pointer!==e.pointerId||!start)return;
    const stack=stacking.read();stacking.disable(true);
    const from=start,to=world(e);alt=e.altKey;pointer=null;busy=true;undo.disabled=close.disabled=size.disabled=row.disabled=magnet.disabled=angle.disabled=true;
    try{check(scene,level);
      const snapped=single?placement(to):{point:to};
      const targets=[snapped.match,snapped.match?.secondary].filter(Boolean).map(m=>scene.tiles.get(m.targetId));
      const signatures=targets.map(t=>JSON.stringify(tileRectangle(t,assets)));
      const changed=()=>disposed||targets.some((target,i)=>!scene.tiles.get(target.id)||target.hidden||!snapTargets([target],assets,level.id).length||JSON.stringify(tileRectangle(target,assets))!==signatures[i]);
      await saveRow(asset,{scene,level,rect,start:from,end:to,point:snapped.point,rotation:snapped.rotation??0,single,stack,widthMeters:single?Number(size.value):widthMeters,cancelled:changed});status.textContent=single?'Element gesetzt. Weiterklicken setzt weitere Exemplare.':'Reihe gesetzt. Weitere Reihe ziehen oder rückgängig machen.';}
    catch(error){status.textContent=error.message;ui.notifications.error(error.message);}
    finally{stacking.disable(false);busy=false;undo.disabled=close.disabled=size.disabled=row.disabled=magnet.disabled=angle.disabled=false;start=end=null;clear();}
  },opts);
  undo.addEventListener('click',async()=>{if(busy)return;busy=true;undo.disabled=true;try{await undoRow(single);status.textContent=single?'Letzte Platzierung zurückgenommen.':'Letzte Reihe zurückgenommen.';}catch(error){status.textContent=error.message;}finally{busy=false;undo.disabled=false;}},opts);
  close.addEventListener('click',dispose,opts);
  for(const target of [overlay,panel])target.addEventListener('contextmenu',e=>{e.preventDefault();e.stopImmediatePropagation();dispose();},opts);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dispose();closeCatalog().catch(error=>ui.notifications.error(error.message));}},{...opts,capture:true});
}
