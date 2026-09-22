import {stackedTile,stackControls} from './stacking.mjs';
import {ID,loadCatalog,tileData,assetPath} from './catalog.mjs';
import {stampCells,saveStamps,rectangleBounds} from './stamps.mjs';
let active,opening=0;
export function closeBrush(){opening++;active?.dispose();}
const history=[];
export function recordHistory(entry){history.push(entry);}
export function pixelsPerMeter(grid) {
  const dummy={key:'scale',name:'scale',file:'assets/boden/scale.webp',widthMeters:1,pixelWidth:1,pixelHeight:1,alphaBounds:[0,0,1,1]};
  return tileData(dummy,{grid,rect:{x:0,y:0,width:1,height:1}}).width;
}
export function renderStroke({bounds,ppm,asset,image}) {
  const scale=Math.min(1,100/ppm),w=Math.ceil(bounds.width*scale),h=Math.ceil(bounds.height*scale);
  if(w>4096 || h>4096) throw new Error('Diese Fläche ist zu groß für einen Strich. Bitte in kleineren Abschnitten malen (höchstens etwa 40 m).');
  const surface=document.createElement('canvas');surface.width=w;surface.height=h;
  const ctx=surface.getContext('2d');
  ctx.setTransform(scale,0,0,scale,-bounds.x*scale,-bounds.y*scale);
  const pattern=ctx.createPattern(image,'repeat');
  if(!pattern) throw new Error('Textur konnte nicht geladen werden.');
  pattern.setTransform(new DOMMatrix().scale(asset.widthMeters*ppm/image.width,asset.heightMeters*ppm/image.height));
  ctx.fillStyle=ctx.strokeStyle=pattern;
  ctx.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);
  return surface;
}
function checkContext(scene,level) {
  if(!game.user.isGM || Number(game.release?.generation)!==14) throw new Error('Der Malpinsel benötigt die Spielleitung und Foundry 14.');
  if(!canvas.ready || !scene || canvas.scene!==scene || !level?.id || canvas.level?.id!==level.id) throw new Error('Szene oder Ebene wurde gewechselt. Bitte den Pinsel neu öffnen.');
}
export async function saveStroke({scene,level,asset,bounds,surface,stack}) {
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
  const data={name:`Gemalt: ${asset.name}`,texture:{src:result.path,anchorX:0,anchorY:0},...bounds,
    rotation:0,hidden:false,locked:false,elevation:level.elevation?.bottom??0,levels:[level.id],
    flags:{[ID]:{painted:true,key:asset.key}}};
  const [tile]=await scene.createEmbeddedDocuments('Tile',[stackedTile(data,scene.tiles,level.id,{mode:stack})]);
  if(!tile) throw new Error('Das gemalte Tile konnte nicht angelegt werden.');
  history.push({scene,levelId:level.id,id:tile.id});
  return tile;
}
export async function undoStroke() {
  checkContext(canvas.scene,canvas.level);
  const index=history.findLastIndex(h=>h.scene===canvas.scene && h.levelId===canvas.level.id);
  if(index<0) throw new Error('Kein eigener Pinselstrich zum Zurücknehmen auf dieser Ebene.');
  const h=history[index];
  if(h.undo){await h.undo();history.splice(index,1);return;}
  const ids=(h.ids??[h.id]).filter(id=>h.scene.tiles.get(id)?.flags?.[ID]?.painted);
  if(ids.length) await h.scene.deleteEmbeddedDocuments('Tile',ids);
  history.splice(index,1);
}
export async function showBrush(assetKey) {
  (await import('./rows.mjs')).closeRows();
  if(active) {active.panel.focus();return;}
  const request=++opening;
  const scene=canvas.scene,level=canvas.level;checkContext(scene,level);
  const ppm=pixelsPerMeter(scene.grid),rect={...canvas.dimensions.sceneRect};
  const assets=(await loadCatalog()).filter(a=>a.kind==='terrain');
  if(request!==opening)return;
  checkContext(scene,level);
  if(active) {active.panel.focus();return;}
  if(!assets.length) throw new Error('Keine Bodentexturen vorhanden.');
  const node=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=node('section');panel.className='ssb-brush';panel.tabIndex=-1;panel.setAttribute('aria-label','SprawlBuilder – Gelände bauen');
  panel.append(node('strong','SprawlBuilder · Gelände bauen'));
  let erasing=false;
  let selected=assets.find(a=>a.key===assetKey)??assets[0];
  const gallery=node('div');gallery.className='ssb-floor-gallery';gallery.setAttribute('role','group');gallery.setAttribute('aria-label','Böden');
  const selectedName=node('p',`Boden: ${selected.name}`);selectedName.setAttribute('aria-live','polite');
  const materialButtons=[];
  for(const asset of assets){
    const card=node('button');card.type='button';card.className='ssb-floor-card';card.setAttribute('aria-label',asset.name);card.setAttribute('aria-pressed',String(asset===selected));
    const image=node('img');image.src=assetPath(asset);image.alt='';image.width=80;image.height=64;
    card.append(image,node('span',asset.name));
    card.addEventListener('click',()=>{if(busy)return;erasing=false;selected=asset;eraser.setAttribute('aria-pressed','false');setEnabled(true);selectedName.textContent=`Boden: ${asset.name}`;for(const button of materialButtons)button.setAttribute('aria-pressed',String(button===card));});
    gallery.append(card);materialButtons.push(card);
  }
  const mode=node('select');mode.setAttribute('aria-label','Malmodus');mode.append(new Option('Stempel · 1 × 1 m','stamp'),new Option('Rechteck · 1-m-Raster','rectangle'));
  const extend=node('button','Ausgewählte Fläche erweitern');extend.addEventListener('click',async()=>{if(busy)return;setEnabled(false);try{(await import('./resize.mjs')).beginResize();}catch(error){status.textContent=error.message;}});
  const eraser=node('button','Boden löschen');eraser.type='button';eraser.setAttribute('aria-pressed','false');
  eraser.addEventListener('click',()=>{if(busy)return;erasing=true;eraser.setAttribute('aria-pressed','true');for(const button of materialButtons)button.setAttribute('aria-pressed','false');selectedName.textContent='Radierer · Boden löschen';setEnabled(true);});
  const undo=node('button','Letzte Aktion zurücknehmen'),close=node('button','Schließen');
  const status=node('p','Boden oder Radierer wählen und direkt loslegen. Esc pausiert.');status.setAttribute('aria-live','polite');
  const stacking=stackControls(undefined,()=>preview());
  panel.append(node('span','Böden'),gallery,selectedName,mode,stacking.node,eraser,extend,undo,close,status);
  const overlay=node('canvas');overlay.className='ssb-brush-overlay';overlay.style.pointerEvents='none';
  document.body.append(overlay,panel);
  let enabled=false,busy=false,points=[],pointer=null,stroke=null,disposed=false,overflow=false,hover=null;
  const controller=new AbortController(),options={signal:controller.signal};
  function clear(){overlay.getContext('2d').clearRect(0,0,overlay.width,overlay.height);}
  function setEnabled(value){enabled=value;overlay.style.pointerEvents=value?'auto':'none';status.textContent=value?(erasing?'Radierer aktiv. Esc pausiert.':'Boden aktiv. Esc pausiert.'):'Pausiert. Boden oder Radierer wählen, um fortzufahren.';points=[];pointer=null;clear();}
  mode.addEventListener('change',()=>{points=[];pointer=null;overflow=false;clear();if(enabled)preview();},options);
  function dispose(){disposed=true;controller.abort();Hooks.off('canvasTearDown',tearHook);Hooks.off('canvasReady',readyHook);overlay.remove();panel.remove();active=null;}
  const tearHook=Hooks.on('canvasTearDown',dispose),readyHook=Hooks.on('canvasReady',dispose);
  active={panel,dispose};
  function resize(){overlay.width=innerWidth;overlay.height=innerHeight;clear();}
  resize();window.addEventListener('resize',()=>{setEnabled(false);resize();},options);
  function world(event){return canvas.canvasCoordinatesFromClient({x:event.clientX,y:event.clientY});}
  function showStack(bounds){if(erasing)return;const t=stackedTile({...bounds,rotation:0,texture:{anchorX:0,anchorY:0},elevation:level.elevation?.bottom??0,flags:{[ID]:{painted:true}}},scene.tiles,level.id,{mode:stacking.read()});stacking.show([t.sort]);}
  function preview(){
    if(mode.value==='stamp'){
      clear();const ctx=overlay.getContext('2d');
      const draw=(cell,fill)=>{showStack(cell);const a=canvas.clientCoordinatesFromCanvas(cell),b=canvas.clientCoordinatesFromCanvas({x:cell.x+ppm,y:cell.y+ppm});ctx.fillStyle=erasing?'rgba(255,80,80,0.3)':'rgba(110,210,140,0.3)';ctx.strokeStyle=erasing?'#ff7777':'#a5ffc0';ctx.lineWidth=2;if(fill)ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);};
      try{if(points.length)for(const cell of stampCells(points,ppm,rect))draw(cell,true);if(hover)for(const cell of stampCells([hover],ppm,rect))draw(cell,false);}catch(error){overflow=true;status.textContent=error.message;}
      return;
    }
    clear();if(!points.length)return;
    try {
      const bounds=rectangleBounds(points[0],points.at(-1),ppm,rect);
      showStack(bounds);const a=canvas.clientCoordinatesFromCanvas(bounds),b=canvas.clientCoordinatesFromCanvas({x:bounds.x+bounds.width,y:bounds.y+bounds.height}),ctx=overlay.getContext('2d');
      ctx.fillStyle=erasing?'rgba(255,80,80,0.45)':'rgba(110,210,140,0.45)';ctx.strokeStyle=erasing?'#ff7777':'#a5ffc0';ctx.lineWidth=2;
      ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    }catch(error){status.textContent=error.message;}
  }
  close.addEventListener('click',dispose,options);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setEnabled(false);e.stopPropagation();}}, {...options,capture:true});
  overlay.addEventListener('contextmenu',e=>{e.preventDefault();setEnabled(false);},options);
  overlay.addEventListener('pointerdown',e=>{
    if(!enabled || busy || e.button!==0)return;
    try {checkContext(scene,level);
      e.preventDefault();overflow=false;pointer=e.pointerId;overlay.setPointerCapture(pointer);points=[world(e)];stroke={mode:mode.value,asset:selected,erasing,stack:stacking.read()};preview();
    }catch(error){status.textContent=error.message;setEnabled(false);}
  },options);
  overlay.addEventListener('pointermove',e=>{if(busy)return;hover=world(e);if(pointer===e.pointerId&&points.length){if(stroke.mode==='rectangle')points=[points[0],hover];else if(points.length<9999)points.push(hover);else overflow=true;}preview();},options);
  overlay.addEventListener('pointerleave',()=>{hover=null;if(!points.length)clear();},options);
  overlay.addEventListener('pointercancel',()=>{points=[];pointer=null;clear();},options);
  overlay.addEventListener('pointerup',async e=>{
    if(pointer!==e.pointerId || !points.length)return;
    const path=stroke.mode==='rectangle'?[points[0],world(e)]:[...points,world(e)];pointer=null;points=[];busy=true;stacking.disable(true);close.disabled=eraser.disabled=undo.disabled=mode.disabled=true;for(const button of materialButtons)button.disabled=true;status.textContent='Strich wird gespeichert …';
    try {
      checkContext(scene,level);if(overflow)throw new Error('Der Strich war zu lang. Bitte in kürzeren Abschnitten malen.');
      if(stroke.erasing){
        const areas=stroke.mode==='stamp'?stampCells(path,ppm,rect):[rectangleBounds(path[0],path.at(-1),ppm,rect)];
        const result=await (await import('./erase.mjs')).eraseTerrain({scene,level,areas});
        status.textContent=`${result.changed} Bodenflächen bearbeitet.${result.skipped?' Gesperrte oder gedrehte Böden übersprungen: '+result.skipped+'.':''} Rückgängig stellt die letzte Aktion wieder her.`;return;
      }
      const image=new Image();image.src=assetPath(stroke.asset);await image.decode();
      if(disposed) return;checkContext(scene,level);
      if(stroke.mode==='stamp'){await saveStamps({scene,level,asset:stroke.asset,cells:stampCells(path,ppm,rect),ppm,image,stack:stroke.stack});status.textContent='1-m-Felder gesetzt. Rückgängig entfernt diesen gesamten Zug.';return;}
      const bounds=rectangleBounds(path[0],path.at(-1),ppm,rect);
      const surface=renderStroke({points:path,...stroke,bounds,ppm,image});
      await saveStroke({scene,level,asset:stroke.asset,bounds,surface,stack:stroke.stack});status.textContent='Gespeichert. Weiter malen oder pausieren, um Tiles zu bearbeiten.';
    }catch(error){status.textContent=error.message;ui.notifications.error(error.message);}
    finally {stacking.disable(false);busy=false;close.disabled=eraser.disabled=undo.disabled=mode.disabled=false;for(const button of materialButtons)button.disabled=false;clear();if(enabled&&!disposed)preview();}
  },options);
  undo.addEventListener('click',async()=>{if(busy)return;busy=true;undo.disabled=eraser.disabled=true;try{await undoStroke();status.textContent='Letzte Aktion zurückgenommen.';}catch(error){status.textContent=error.message;}finally{busy=false;undo.disabled=eraser.disabled=false;}},options);
}
