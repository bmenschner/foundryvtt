import {ID,loadCatalog,assetPath} from './catalog.mjs';
import {pixelsPerMeter,renderStroke} from './brush.mjs';
let stopResize;
export function tileBounds(tile){const anchorX=tile.texture?.anchorX??tile.anchorX??0.5,anchorY=tile.texture?.anchorY??tile.anchorY??0.5;return {x:tile.x-anchorX*tile.width,y:tile.y-anchorY*tile.height,width:tile.width,height:tile.height};}
export function dragEdge(bounds,edge,point,min=1){
  const b={...bounds},right=b.x+b.width,bottom=b.y+b.height;
  if(edge==='left'){b.x=Math.min(point.x,right-min);b.width=right-b.x;}
  else if(edge==='right')b.width=Math.max(min,point.x-b.x);
  else if(edge==='top'){b.y=Math.min(point.y,bottom-min);b.height=bottom-b.y;}
  else if(edge==='bottom')b.height=Math.max(min,point.y-b.y);
  else throw new Error('Ungültige Kante.');
  return b;
}
export async function resizePainted(tile,bounds){
  const scene=canvas.scene,level=canvas.level;
  function valid(){if(!game.user.isGM||!canvas.ready||tile.parent!==scene||canvas.scene!==scene||canvas.level?.id!==level?.id||!tile.flags?.[ID]?.painted||tile.locked||tile.rotation)throw new Error('Bitte ein entsperrtes, ungedrehtes gemaltes Tile auf der aktuellen Ebene auswählen.');}
  valid();
  if(!(tile.levels?.has?.(level.id)||tile.levels?.includes?.(level.id)))throw new Error('Das Tile gehört zu einer anderen Ebene.');
  const before={x:tile.x,y:tile.y,width:tile.width,height:tile.height,anchorX:tile.texture?.anchorX??tile.anchorX??0.5,anchorY:tile.texture?.anchorY??tile.anchorY??0.5,src:tile.texture.src};
  const asset=(await loadCatalog()).find(a=>a.key===tile.flags[ID].key);if(!asset)throw new Error('Bodentextur fehlt im Katalog.');
  const texture=new Image(),mask=new Image();texture.src=assetPath(asset);mask.src=before.src;await Promise.all([texture.decode(),mask.decode()]);valid();
  const ppm=pixelsPerMeter(scene.grid);
  const surface=renderStroke({points:[{x:bounds.x,y:bounds.y}],diameter:1,mode:'rectangle',bounds,ppm,asset,image:texture});
  const ctx=surface.getContext('2d');ctx.resetTransform();ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,surface.width,surface.height);
  const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));if(!blob)throw new Error('Fläche konnte nicht gespeichert werden.');
  const world=game.world.id;if(!/^[\w-]+$/.test(world))throw new Error('Ungültiger Weltordner.');
  valid();const result=await foundry.applications.apps.FilePicker.implementation.upload('data',`worlds/${world}/${ID}-painted`,new File([blob],`${asset.key}-${crypto.randomUUID()}.png`,{type:'image/png'}),{},{notify:false});
  if(!result?.path||result.error)throw new Error(result?.error||'Upload fehlgeschlagen.');valid();
  const current={x:tile.x,y:tile.y,width:tile.width,height:tile.height,anchorX:tile.texture?.anchorX??tile.anchorX??0.5,anchorY:tile.texture?.anchorY??tile.anchorY??0.5,src:tile.texture.src};
  if(Object.keys(before).some(key=>current[key]!==before[key]))throw new Error('Das Tile wurde zwischenzeitlich verändert. Bitte erneut ziehen.');
  await tile.update({...bounds,'texture.src':result.path,'texture.anchorX':0,'texture.anchorY':0});
}
export function beginResize(){
  stopResize?.();
  const tile=canvas.tiles?.controlled?.[0]?.document;
  if(!tile?.flags?.[ID]?.painted||tile.locked||tile.rotation)throw new Error('Zuerst den Pinsel pausieren und ein entsperrtes, ungedrehtes gemaltes Tile auf der Tile-Ebene auswählen.');
  const original=tileBounds(tile),scene=canvas.scene,level=canvas.level;let next=original,busy=false;
  const overlay=document.createElement('div');overlay.className='age-resize';document.body.append(overlay);
  const frame=document.createElement('div');frame.className='age-resize-frame';overlay.append(frame);
  const controller=new AbortController(),opts={signal:controller.signal};
  const close=()=>{controller.abort();overlay.remove();Hooks.off('canvasTearDown',hook);Hooks.off('canvasPan',pan);stopResize=undefined;};
  stopResize=close;
  const hook=Hooks.on('canvasTearDown',close),pan=Hooks.on('canvasPan',()=>draw(next));
  function draw(b){const a=canvas.clientCoordinatesFromCanvas(b),z=canvas.clientCoordinatesFromCanvas({x:b.x+b.width,y:b.y+b.height});Object.assign(frame.style,{left:`${a.x}px`,top:`${a.y}px`,width:`${z.x-a.x}px`,height:`${z.y-a.y}px`});}
  for(const [edge,label] of [['left','Links'],['right','Rechts'],['top','Oben'],['bottom','Unten']]){
    const handle=document.createElement('button');handle.className=`age-edge age-edge-${edge}`;handle.title=`${label} ziehen`;handle.setAttribute('aria-label',handle.title);frame.append(handle);let pointer;
    handle.addEventListener('pointerdown',e=>{if(busy)return;e.preventDefault();e.stopPropagation();pointer=e.pointerId;handle.setPointerCapture(pointer);},opts);
    handle.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;const p=canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY});next=dragEdge(original,edge,p,pixelsPerMeter(scene.grid)*0.25);draw(next);},opts);
    handle.addEventListener('pointerup',async e=>{if(pointer!==e.pointerId)return;pointer=null;busy=true;try{if(canvas.scene!==scene||canvas.level?.id!==level.id)throw new Error('Szene oder Ebene wurde gewechselt.');await resizePainted(tile,next);ui.notifications.info('Fläche angepasst. Texturmaßstab erhalten.');}catch(error){ui.notifications.error(error.message);}finally{close();}},opts);
    handle.addEventListener('pointercancel',close,opts);
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!busy)close();},opts);draw(next);
  ui.notifications.info('Eine der vier Kanten ziehen. Esc bricht ab.');
  return close;
}
