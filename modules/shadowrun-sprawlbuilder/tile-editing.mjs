import {ID,loadCatalog} from './catalog.mjs';
import {tileRectangle,snapTargets,snapToEdges} from './snapping.mjs';
let assets=new Map(),panel,closePanel,guide;
let enabled=true,registered=false;
const radians=a=>a*Math.PI/180;
export const owned=doc=>!!doc?.flags?.[ID];
const zoom=()=>{const a=canvas.clientCoordinatesFromCanvas({x:0,y:0}),b=canvas.clientCoordinatesFromCanvas({x:1,y:0});return Math.hypot(b.x-a.x,b.y-a.y);};
function editable(doc){return game.user.isGM&&canvas.ready&&doc?.parent===canvas.scene&&!doc.locked&&(doc.levels?.has?.(canvas.level?.id)||doc.levels?.includes?.(canvas.level?.id));}
export function transformTile(tile,{width,height,rotation=tile.rotation??0},catalog=assets){
  const before=tileRectangle(tile,catalog);
  if(!before||![width,height,rotation].every(Number.isFinite)||width<1||height<1)throw new Error('Breite und Höhe müssen mindestens einen Szenenpixel betragen.');
  const data={...tile.toObject(),width:tile.width*width/before.width,height:tile.height*height/before.height,rotation:((rotation%360)+360)%360};
  const after=tileRectangle(data,catalog);
  return {width:data.width,height:data.height,rotation:data.rotation,x:data.x+before.x-after.x,y:data.y+before.y-after.y};
}
export function resizeCorner(tile,point,locked,catalog=assets){
  const b=tileRectangle(tile,catalog),c=Math.cos(radians(b.rotation)),s=Math.sin(radians(b.rotation));
  const top={x:b.x-c*b.width/2+s*b.height/2,y:b.y-s*b.width/2-c*b.height/2};
  const dx=point.x-top.x,dy=point.y-top.y;let w=Math.max(1,c*dx+s*dy),h=Math.max(1,-s*dx+c*dy);
  if(locked){const scale=Math.max(w/b.width,h/b.height,1/Math.min(b.width,b.height));w=b.width*scale;h=b.height*scale;}
  const result=transformTile(tile,{width:w,height:h},catalog);
  result.x+=c*(w-b.width)/2-s*(h-b.height)/2;result.y+=s*(w-b.width)/2+c*(h-b.height)/2;
  return result;
}
function hideGuides(){guide?.remove();guide=null;}
function drawGuides(match){
  hideGuides();if(!match)return;
  guide=document.createElement('canvas');guide.className='ssb-edit-guides';guide.width=innerWidth;guide.height=innerHeight;document.body.append(guide);
  const ctx=guide.getContext('2d');ctx.strokeStyle='#ffd166';ctx.lineWidth=2;
  for(const m of [match,match.secondary].filter(Boolean)){const [a,b]=m.edge.map(p=>canvas.clientCoordinatesFromCanvas(p));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
}
export function moveSnap(doc,update,{catalog=assets,targets,zoom:scale=1,previous=null,alt=false}={}){
  const proposed={...doc.toObject(),...update},b=tileRectangle(proposed,catalog);
  if(!b||alt)return {update,match:null};
  const result=snapToEdges({point:{x:b.x,y:b.y},width:b.width,height:b.height,rotation:b.rotation,targets:targets.filter(t=>t.id!==doc.id),zoom:scale,previous,allowRotation:false});
  return {update:{...update,x:proposed.x+result.point.x-b.x,y:proposed.y+result.point.y-b.y},match:result.match};
}
const borderState=new WeakMap();
export function styleTile(object){
  const parts=[object.frame,object.controls?.border,object.controls?.handles,object.controlIcon].filter(Boolean);
  const hide=game.user.isGM&&owned(object.document)&&(object.controlled||object.isPreview);
  for(const part of parts){
    if(hide){if(!borderState.has(part))borderState.set(part,{renderable:part.renderable,eventMode:part.eventMode});part.renderable=false;part.eventMode='none';}
    else if(borderState.has(part)){Object.assign(part,borderState.get(part));borderState.delete(part);}
  }
}
export function editingClass(Base){return class SprawlBuilderTile extends Base{
  getSnappedPosition(position){
    if(owned(this.document)&&game.user.isGM&&canvas.tiles?.controlled?.length===1)return position??{x:this.document.x,y:this.document.y};
    return super.getSnappedPosition(position);
  }
  _refreshState(){const result=super._refreshState();styleTile(this);return result;}
  _applyRenderFlags(flags){const result=super._applyRenderFlags(flags);styleTile(this);return result;}
  _updateDragPreviews(event){
    super._updateDragPreviews(event);
    if(!owned(this.document)||!editable(this.document)||canvas.tiles?.controlled?.length!==1)return;
    const previews=Array.from(this.layer.preview?.children??[]).filter(p=>p._original===this||p.document?.id===this.document.id);
    for(const preview of previews){
      const result=moveSnap(this.document,{x:preview.document.x,y:preview.document.y},{targets:snapTargets(canvas.scene.tiles,assets,canvas.level.id),zoom:zoom(),previous:this.ssbMatch?.key,alt:!enabled||event.altKey||event.nativeEvent?.altKey});
      this.ssbMatch=result.match;preview.document.updateSource(result.update);preview.renderFlags.set({refreshPosition:true});styleTile(preview);drawGuides(result.match);
    }
  }
  _prepareDragLeftDropUpdates(event){
    const updates=super._prepareDragLeftDropUpdates(event);
    if(!owned(this.document)||!editable(this.document)||canvas.tiles?.controlled?.length!==1||updates.length!==1)return updates;
    const result=moveSnap(this.document,updates[0],{targets:snapTargets(canvas.scene.tiles,assets,canvas.level.id),zoom:zoom(),previous:this.ssbMatch?.key,alt:!enabled||event.altKey||event.nativeEvent?.altKey});
    return [result.update];
  }
  _onDragLeftCancel(event){hideGuides();this.ssbMatch=null;return super._onDragLeftCancel(event);}
  _onDragLeftDrop(event){try{return super._onDragLeftDrop(event);}finally{hideGuides();this.ssbMatch=null;}}
};}
export function showTileEditor(object){
  closePanel?.();if(!owned(object?.document)||!editable(object.document)||canvas.tiles?.controlled?.length!==1)return;
  const doc=object.document,controller=new AbortController(),opts={signal:controller.signal};let busy=false,drag=null,ghost=null;
  panel=document.createElement('section');panel.className='ssb-tile-editor';panel.setAttribute('aria-label','Asset bearbeiten');
  const title=document.createElement('strong');title.textContent=doc.name??'Asset';panel.append(title);
  const row=document.createElement('div');row.className='ssb-edit-buttons';panel.append(row);
  function button(label,icon,action){const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);const i=document.createElement('i');i.className=`fa-solid ${icon}`;i.setAttribute('aria-hidden','true');b.append(i);b.addEventListener('click',action,opts);row.append(b);return b;}
  function field(label,value,type='number'){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.type=type;input.setAttribute('aria-label',label);if(type==='checkbox')input.checked=value;else{input.value=value;input.step='1';}l.append(input);panel.append(l);return input;}
  const shape=()=>tileRectangle(doc,assets),initial=shape();if(!initial)return;
  const width=field('Breite (px)',initial.width),height=field('Höhe (px)',initial.height),angle=field('Winkel (°)',doc.rotation??0),magnet=field('Kanten einrasten',enabled,'checkbox');let ratio=true;
  const lock=button('Seitenverhältnis beibehalten','fa-lock',()=>{ratio=!ratio;lock.setAttribute('aria-pressed',String(ratio));lock.firstChild.className=`fa-solid ${ratio?'fa-lock':'fa-lock-open'}`;});lock.setAttribute('aria-pressed','true');
  async function apply(data){if(busy)return;if(!editable(doc))return closePanel?.();busy=true;
    try{await doc.update(data);}catch(e){ui.notifications.error(e.message);}finally{busy=false;sync();}}
  for(const sign of [-1,1])button(sign>0?'Vergrößern':'Verkleinern',sign>0?'fa-plus':'fa-minus',()=>{const b=shape(),factor=sign>0?1+Math.max(.01,1/Math.max(b.width,b.height)):Math.max(1/Math.min(b.width,b.height),1-Math.max(.01,1/Math.max(b.width,b.height)));apply(transformTile(doc,{width:b.width*factor,height:b.height*factor}));});
  button('Drehen um 1°','fa-rotate-right',()=>{const b=shape();apply(transformTile(doc,{width:b.width,height:b.height,rotation:(doc.rotation??0)+1}));});
  for(const [input,key] of [[width,'width'],[height,'height'],[angle,'rotation']])input.addEventListener('change',()=>{try{const b=shape(),data={width:b.width,height:b.height,rotation:doc.rotation??0},value=Number(input.value);data[key]=value;if(ratio&&key==='width')data.height=b.height*value/b.width;if(ratio&&key==='height')data.width=b.width*value/b.height;apply(transformTile(doc,data));}catch(e){ui.notifications.error(e.message);sync();}},opts);
  magnet.addEventListener('change',()=>{enabled=magnet.checked;hideGuides();},opts);
  const handle=document.createElement('button');handle.className='ssb-edit-corner';handle.textContent='+';handle.title='Frei skalieren';handle.setAttribute('aria-label','Frei skalieren');document.body.append(panel,handle);
  function sync(){if(drag)return;const b=shape();width.value=String(Math.round(b.width*1000)/1000);height.value=String(Math.round(b.height*1000)/1000);angle.value=String(doc.rotation??0);const c=Math.cos(radians(b.rotation)),s=Math.sin(radians(b.rotation)),p=canvas.clientCoordinatesFromCanvas({x:b.x+c*b.width/2-s*b.height/2,y:b.y+s*b.width/2+c*b.height/2});handle.style.left=`${p.x-8}px`;handle.style.top=`${p.y-8}px`;}
  handle.addEventListener('pointerdown',e=>{if(busy||!editable(doc)||e.button!==0)return;e.preventDefault();e.stopPropagation();handle.setPointerCapture(e.pointerId);drag={id:e.pointerId,data:null};},opts);
  handle.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const p=canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY});drag.data=resizeCorner(doc,p,ratio);const b=tileRectangle({...doc.toObject(),...drag.data},assets);width.value=String(Math.round(b.width));height.value=String(Math.round(b.height));
    if(!ghost){ghost=document.createElement('img');ghost.src=doc.texture.src;ghost.className='ssb-edit-ghost';document.body.append(ghost);}
    const full=tileRectangle({...doc.toObject(),...drag.data},new Map()),z=zoom(),centre=canvas.clientCoordinatesFromCanvas(full);Object.assign(ghost.style,{left:`${centre.x-drag.data.width*z/2}px`,top:`${centre.y-drag.data.height*z/2}px`,width:`${drag.data.width*z}px`,height:`${drag.data.height*z}px`,transform:`rotate(${drag.data.rotation}deg)`});handle.style.left=`${e.clientX-8}px`;handle.style.top=`${e.clientY-8}px`;},opts);
  handle.addEventListener('pointerup',async e=>{if(drag?.id!==e.pointerId)return;const data=drag.data;drag=null;ghost?.remove();ghost=null;if(data)await apply(data);else sync();},opts);
  handle.addEventListener('pointercancel',()=>{drag=null;ghost?.remove();ghost=null;sync();},opts);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){drag=null;ghost?.remove();ghost=null;sync();}},opts);
  const pan=Hooks.on('canvasPan',sync),update=Hooks.on('updateTile',tile=>{if(tile.id===doc.id){if(tile.locked)closePanel?.();else sync();}});
  closePanel=()=>{controller.abort();Hooks.off('canvasPan',pan);Hooks.off('updateTile',update);panel?.remove();panel=null;handle.remove();ghost?.remove();closePanel=null;hideGuides();};sync();
}
export function registerTileEditing(){
  if(registered)return;registered=true;CONFIG.Tile.objectClass=editingClass(CONFIG.Tile.objectClass);
  Hooks.on('controlTile',()=>{const selected=canvas.tiles?.controlled??[];showTileEditor(selected.length===1?selected[0]:null);});
  Hooks.on('canvasTearDown',()=>{closePanel?.();hideGuides();});
  Hooks.on('deleteTile',doc=>{if(panel&&owned(doc))closePanel?.();});
  Hooks.on('deactivateTilesLayer',()=>{closePanel?.();hideGuides();});
  Hooks.once('ready',async()=>{try{assets=new Map((await loadCatalog()).map(a=>[a.key,a]));}catch(e){ui.notifications.error(e.message);}});
}
