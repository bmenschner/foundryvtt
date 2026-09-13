import {ID,loadCatalog,tileData,assetPath} from './catalog.mjs';
import {stampCells,saveStamps} from './stamps.mjs';
let active;
const history=[];
export function recordHistory(entry){history.push(entry);}
export function squareCells(points,size) {
  if(!points.length || !Number.isFinite(size) || size<=0)throw new Error('Ungültige Pinselbreite.');
  const origin=points[0],cells=new Map();let last={x:0,y:0};
  function add(x,y){if(cells.size>=4096)throw new Error('Bitte kürzere Abschnitte malen.');cells.set(`${x},${y}`,{x:origin.x+x*size,y:origin.y+y*size,width:size,height:size});}
  add(0,0);
  for(const p of points){const next={x:Math.floor((p.x-origin.x)/size),y:Math.floor((p.y-origin.y)/size)};
    while(last.x!==next.x || last.y!==next.y){if(last.x!==next.x)last.x+=Math.sign(next.x-last.x);else last.y+=Math.sign(next.y-last.y);add(last.x,last.y);}}
  return [...cells.values()];
}

export function strokeBounds(points,diameter,mode,rect) {
  if (!['freehand','rectangle'].includes(mode) || !points.length || points.length>10000 || !points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)) || !Number.isFinite(diameter) || diameter<=0) throw new Error('Ungültiger Pinselstrich.');
  if(mode==='freehand') {const cells=squareCells(points,diameter);return strokeBounds(cells.flatMap(c=>[{x:c.x,y:c.y},{x:c.x+c.width,y:c.y+c.height}]),diameter,'rectangle',rect);}
  const pad=0;
  const x=Math.max(rect.x,Math.floor(Math.min(...points.map(p=>p.x))-pad));
  const y=Math.max(rect.y,Math.floor(Math.min(...points.map(p=>p.y))-pad));
  const right=Math.min(rect.x+rect.width,Math.ceil(Math.max(...points.map(p=>p.x))+pad));
  const bottom=Math.min(rect.y+rect.height,Math.ceil(Math.max(...points.map(p=>p.y))+pad));
  if(right<=x || bottom<=y) throw new Error('Bitte eine Fläche innerhalb der Szene zeichnen.');
  return {x,y,width:right-x,height:bottom-y};
}
export function pixelsPerMeter(grid) {
  const dummy={key:'scale',name:'scale',file:'assets/boden/scale.webp',widthMeters:1,pixelWidth:1,pixelHeight:1,alphaBounds:[0,0,1,1]};
  return tileData(dummy,{grid,rect:{x:0,y:0,width:1,height:1}}).width;
}
export function renderStroke({points,diameter,mode,bounds,ppm,asset,image}) {
  const scale=Math.min(1,100/ppm),w=Math.ceil(bounds.width*scale),h=Math.ceil(bounds.height*scale);
  if(w>4096 || h>4096) throw new Error('Diese Fläche ist zu groß für einen Strich. Bitte in kleineren Abschnitten malen (höchstens etwa 40 m).');
  const surface=document.createElement('canvas');surface.width=w;surface.height=h;
  const ctx=surface.getContext('2d');
  ctx.setTransform(scale,0,0,scale,-bounds.x*scale,-bounds.y*scale);
  const pattern=ctx.createPattern(image,'repeat');
  if(!pattern) throw new Error('Textur konnte nicht geladen werden.');
  pattern.setTransform(new DOMMatrix().scale(asset.widthMeters*ppm/image.width,asset.heightMeters*ppm/image.height));
  ctx.fillStyle=ctx.strokeStyle=pattern;
  if(mode==='rectangle') ctx.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);
  else {
    for(const cell of squareCells(points,diameter))ctx.fillRect(cell.x,cell.y,cell.width,cell.height);
  }
  return surface;
}
function checkContext(scene,level) {
  if(!game.user.isGM || Number(game.release?.generation)!==14) throw new Error('Der Malpinsel benötigt die Spielleitung und Foundry 14.');
  if(!canvas.ready || !scene || canvas.scene!==scene || !level?.id || canvas.level?.id!==level.id) throw new Error('Szene oder Ebene wurde gewechselt. Bitte den Pinsel neu öffnen.');
}
export async function saveStroke({scene,level,asset,bounds,surface}) {
  checkContext(scene,level);
  const world=game.world.id;
  if(!/^[a-zA-Z0-9_-]+$/.test(world)) throw new Error('Ungültiger Weltordner.');
  const picker=foundry.applications.apps.FilePicker.implementation;
  const folder=`worlds/${world}/${ID}-painted`;
  try {await picker.browse('data',folder);}
  catch {try {await picker.createDirectory('data',folder);} catch {await picker.browse('data',folder);}}
  checkContext(scene,level);
  const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));
  if(!blob) throw new Error('Das Pinselbild konnte nicht gespeichert werden.');
  checkContext(scene,level);
  const result=await picker.upload('data',folder,new File([blob],`${asset.key}-${crypto.randomUUID()}.png`,{type:'image/png'}),{},{notify:false});
  if(!result?.path || result.error) throw new Error(result?.error || 'Upload fehlgeschlagen.');
  checkContext(scene,level);
  const tiles=Array.from(scene.tiles??[]).filter(t=>t.levels?.has?.(level.id) || t.levels?.includes?.(level.id));
  const ceiling=Math.min(0,...tiles.filter(t=>!t.flags?.[ID]?.painted).map(t=>t.sort??0));
  const latest=Math.max(ceiling-100000,...tiles.filter(t=>t.flags?.[ID]?.painted).map(t=>t.sort??0));
  const [tile]=await scene.createEmbeddedDocuments('Tile',[{name:`Gemalt: ${asset.name}`,texture:{src:result.path},...bounds,
    anchorX:0,anchorY:0,rotation:0,hidden:false,locked:false,sort:Math.min(ceiling-1,latest+1),elevation:level.elevation?.bottom??0,levels:[level.id],
    flags:{[ID]:{painted:true,key:asset.key}}}]);
  if(!tile) throw new Error('Das gemalte Tile konnte nicht angelegt werden.');
  history.push({scene,levelId:level.id,id:tile.id});
  return tile;
}
export async function undoStroke() {
  checkContext(canvas.scene,canvas.level);
  const index=history.findLastIndex(h=>h.scene===canvas.scene && h.levelId===canvas.level.id);
  if(index<0) throw new Error('Kein eigener Pinselstrich zum Zurücknehmen auf dieser Ebene.');
  const h=history[index],ids=(h.ids??[h.id]).filter(id=>h.scene.tiles.get(id)?.flags?.[ID]?.painted);
  if(ids.length) await h.scene.deleteEmbeddedDocuments('Tile',ids);
  history.splice(index,1);
}
export async function showBrush() {
  if(active) {active.panel.focus();return;}
  const scene=canvas.scene,level=canvas.level;checkContext(scene,level);
  const ppm=pixelsPerMeter(scene.grid),rect={...canvas.dimensions.sceneRect};
  const assets=(await loadCatalog()).filter(a=>a.kind==='terrain');
  checkContext(scene,level);
  if(!assets.length) throw new Error('Keine Bodentexturen vorhanden.');
  const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=node('section');panel.className='age-brush';panel.tabIndex=-1;panel.setAttribute('aria-label','Boden malen');
  panel.append(node('strong','Boden malen'));
  const material=node('select');material.setAttribute('aria-label','Material');for(const a of assets)material.append(new Option(a.name,a.key));
  const mode=node('select');mode.setAttribute('aria-label','Malmodus');mode.append(new Option('Stempel · 1 × 1 m','stamp'),new Option('Freihand','freehand'),new Option('Rechteck','rectangle'));
  const width=node('input');width.type='number';width.min='0.25';width.max='20';width.step='0.25';width.value='2';width.setAttribute('aria-label','Pinselbreite in Metern');
  const label=node('label','Pinselbreite (m)');label.append(width);
  width.disabled=true;label.hidden=true;mode.addEventListener('change',()=>{width.disabled=mode.value==='stamp';label.hidden=mode.value==='stamp';});
  const extend=node('button','Ausgewählte Fläche erweitern');extend.addEventListener('click',async()=>{if(busy)return;setEnabled(false);try{(await import('./resize.mjs')).beginResize();}catch(error){status.textContent=error.message;}});
  const toggle=node('button','Malen starten'),undo=node('button','Letzten Strich zurücknehmen'),close=node('button','Schließen');
  const status=node('p','Material wählen und Malen starten. Esc beendet den Malmodus.');status.setAttribute('aria-live','polite');
  panel.append(material,mode,label,toggle,extend,undo,close,status);
  const overlay=node('canvas');overlay.className='age-brush-overlay';overlay.style.pointerEvents='none';
  document.body.append(overlay,panel);
  let enabled=false,busy=false,points=[],pointer=null,stroke=null,disposed=false,overflow=false,hover=null;
  const controller=new AbortController(),options={signal:controller.signal};
  function clear(){overlay.getContext('2d').clearRect(0,0,overlay.width,overlay.height);}
  function setEnabled(value){enabled=value;overlay.style.pointerEvents=value?'auto':'none';toggle.textContent=value?'Malen pausieren':'Malen starten';points=[];pointer=null;clear();}
  function dispose(){disposed=true;controller.abort();Hooks.off('canvasTearDown',tearHook);Hooks.off('canvasReady',readyHook);overlay.remove();panel.remove();active=null;}
  const tearHook=Hooks.on('canvasTearDown',dispose),readyHook=Hooks.on('canvasReady',dispose);
  active={panel,dispose};
  function resize(){overlay.width=innerWidth;overlay.height=innerHeight;clear();}
  resize();window.addEventListener('resize',()=>{setEnabled(false);resize();},options);
  function world(event){return canvas.canvasCoordinatesFromClient({x:event.clientX,y:event.clientY});}
  function preview(){
    if(mode.value==='stamp'){
      clear();const ctx=overlay.getContext('2d');
      const draw=(cell,fill)=>{const a=canvas.clientCoordinatesFromCanvas(cell),b=canvas.clientCoordinatesFromCanvas({x:cell.x+ppm,y:cell.y+ppm});ctx.fillStyle='rgba(110,210,140,0.3)';ctx.strokeStyle='#a5ffc0';ctx.lineWidth=2;if(fill)ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);};
      try{if(points.length)for(const cell of stampCells(points,ppm,rect))draw(cell,true);if(hover)for(const cell of stampCells([hover],ppm,rect))draw(cell,false);}catch(error){overflow=true;status.textContent=error.message;}
      return;
    }
    clear();if(!points.length)return;
    const ctx=overlay.getContext('2d'),client=points.map(p=>canvas.clientCoordinatesFromCanvas(p));
    ctx.strokeStyle=ctx.fillStyle='rgba(110,210,140,0.45)';
    if(stroke.mode==='rectangle'){const a=client[0],b=client.at(-1);ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);}
    else {for(const cell of squareCells(points,stroke.diameter)){const a=canvas.clientCoordinatesFromCanvas(cell),b=canvas.clientCoordinatesFromCanvas({x:cell.x+cell.width,y:cell.y+cell.height});ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);}}
  }
  toggle.addEventListener('click',()=>{if(!busy)setEnabled(!enabled);},options);
  close.addEventListener('click',dispose,options);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setEnabled(false);e.stopPropagation();}}, {...options,capture:true});
  overlay.addEventListener('contextmenu',e=>{e.preventDefault();setEnabled(false);},options);
  overlay.addEventListener('pointerdown',e=>{
    if(!enabled || busy || e.button!==0)return;
    try {checkContext(scene,level);const metres=Number(width.value);if(!Number.isFinite(metres)||metres<0.25||metres>20)throw new Error('Pinselbreite: 0,25 bis 20 m.');
      e.preventDefault();overflow=false;pointer=e.pointerId;overlay.setPointerCapture(pointer);points=[world(e)];stroke={mode:mode.value,diameter:metres*ppm,asset:assets.find(a=>a.key===material.value)};preview();
    }catch(error){status.textContent=error.message;setEnabled(false);}
  },options);
  overlay.addEventListener('pointermove',e=>{if(busy)return;hover=world(e);if(pointer===e.pointerId&&points.length){if(stroke.mode==='rectangle')points=[points[0],hover];else if(points.length<9999)points.push(hover);else overflow=true;}preview();},options);
  overlay.addEventListener('pointerleave',()=>{hover=null;if(!points.length)clear();},options);
  overlay.addEventListener('pointercancel',()=>{points=[];pointer=null;clear();},options);
  overlay.addEventListener('pointerup',async e=>{
    if(pointer!==e.pointerId || !points.length)return;
    const path=stroke.mode==='rectangle'?[points[0],world(e)]:[...points,world(e)];pointer=null;points=[];busy=true;close.disabled=toggle.disabled=undo.disabled=true;status.textContent='Strich wird gespeichert …';
    try {
      checkContext(scene,level);if(overflow)throw new Error('Der Strich war zu lang. Bitte in kürzeren Abschnitten malen.');
      const image=new Image();image.src=assetPath(stroke.asset);await image.decode();
      if(disposed) return;checkContext(scene,level);
      if(stroke.mode==='stamp'){await saveStamps({scene,level,asset:stroke.asset,cells:stampCells(path,ppm,rect),ppm,image});status.textContent='1-m-Felder gesetzt. Rückgängig entfernt diesen gesamten Zug.';return;}
      const bounds=strokeBounds(path,stroke.diameter,stroke.mode,rect);
      const surface=renderStroke({points:path,...stroke,bounds,ppm,image});
      await saveStroke({scene,level,asset:stroke.asset,bounds,surface});status.textContent='Gespeichert. Weiter malen oder pausieren, um Tiles zu bearbeiten.';
    }catch(error){status.textContent=error.message;ui.notifications.error(error.message);}
    finally {busy=false;close.disabled=toggle.disabled=undo.disabled=false;clear();if(enabled&&!disposed)preview();}
  },options);
  undo.addEventListener('click',async()=>{if(busy)return;busy=true;undo.disabled=toggle.disabled=true;try{await undoStroke();status.textContent='Letzter Strich zurückgenommen.';}catch(error){status.textContent=error.message;}finally{busy=false;undo.disabled=toggle.disabled=false;}},options);
}
