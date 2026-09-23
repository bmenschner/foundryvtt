import {ID,assetPath,loadCatalog} from './catalog.mjs';
import {pixelsPerMeter} from './brush.mjs';
import {rectangleBounds} from './stamps.mjs';
import {stackedTile} from './stacking.mjs';
import {movablePanel} from './panels.mjs';

export const roofMaterials=[
  ['boden-beton-01','Betondach'],['boden-kies-01','Kiesdach'],
  ['boden-industrie-01','Metalldach'],['boden-gras-02','Gründach']
];
let active,opening=0;
const history=[];
export function closeBuildings(){opening++;active?.dispose();}

export function roofOutline(width,height,shape='rectangle'){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<3||height<3||width>40||height>40)throw new Error('Gebäude benötigen 3–40 m Breite und Tiefe.');
  if(shape==='rectangle')return [[0,0],[width,0],[width,height],[0,height]];
  if(shape!=='l')throw new Error('Unbekannte Gebäudeform.');
  if(width<5||height<5)throw new Error('Eine L-Form benötigt mindestens 5 × 5 m.');
  const cutX=Math.max(2,Math.floor(width*.55)),cutY=Math.max(2,Math.floor(height*.45));
  return [[0,0],[cutX,0],[cutX,cutY],[width,cutY],[width,height],[0,height]];
}
function path(ctx,points){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();}
export function balconyBounds(points,side){
  if(side==='none')return null;
  const edges=points.map((a,i)=>({a,b:points[(i+1)%points.length]}));
  const candidates=edges.filter(({a,b})=>side==='north'?a[1]===b[1]&&b[0]>a[0]&&a[1]===0:
    side==='south'?a[1]===b[1]&&b[0]<a[0]&&a[1]===Math.max(...points.map(p=>p[1])):
    side==='east'?a[0]===b[0]&&b[1]>a[1]&&a[0]===Math.max(...points.map(p=>p[0])):
    side==='west'?a[0]===b[0]&&b[1]<a[1]&&a[0]===0:false);
  const edge=candidates.sort((x,y)=>Math.hypot(y.b[0]-y.a[0],y.b[1]-y.a[1])-Math.hypot(x.b[0]-x.a[0],x.b[1]-x.a[1]))[0];
  if(!edge)return null;
  const x=Math.min(edge.a[0],edge.b[0]),y=Math.min(edge.a[1],edge.b[1]);
  return side==='north'?{x,y:y-1,width:Math.abs(edge.b[0]-edge.a[0]),height:1,open:'south'}:
    side==='south'?{x,y:y,width:Math.abs(edge.b[0]-edge.a[0]),height:1,open:'north'}:
    side==='east'?{x:x,y,width:1,height:Math.abs(edge.b[1]-edge.a[1]),open:'west'}:
    {x:x-1,y,width:1,height:Math.abs(edge.b[1]-edge.a[1]),open:'east'};
}
export function renderBuilding({bounds,ppm,shape='rectangle',balcony='none',asset,image}){
  if(!asset||!image)throw new Error('Dachtextur fehlt.');
  const width=bounds.width/ppm,height=bounds.height/ppm,points=roofOutline(width,height,shape),deck=balconyBounds(points,balcony);
  const pad=1.4,frame={x:bounds.x-pad*ppm,y:bounds.y-pad*ppm,width:bounds.width+pad*2*ppm,height:bounds.height+pad*2*ppm};
  const factor=Math.min(1,4096/Math.max(frame.width,frame.height));
  const surface=document.createElement('canvas');surface.width=Math.ceil(frame.width*factor);surface.height=Math.ceil(frame.height*factor);
  const ctx=surface.getContext('2d');ctx.setTransform(ppm*factor,0,0,ppm*factor,pad*ppm*factor,pad*ppm*factor);
  ctx.lineJoin='miter';ctx.lineCap='square';
  // Balkonplatte vor dem Dach zeichnen. Die Anschlussseite bleibt offen.
  if(deck){
    ctx.fillStyle='#252b2d';ctx.fillRect(deck.x+.08,deck.y+.15,deck.width,deck.height);
    ctx.fillStyle='#8e9391';ctx.fillRect(deck.x,deck.y,deck.width,deck.height);
    ctx.strokeStyle='#d2cbb5';ctx.lineWidth=.07;
    for(let i=.3;i<Math.max(deck.width,deck.height);i+=.35){ctx.beginPath();if(deck.width>deck.height){ctx.moveTo(deck.x+i,deck.y+.12);ctx.lineTo(deck.x+i,deck.y+.9);}else{ctx.moveTo(deck.x+.12,deck.y+i);ctx.lineTo(deck.x+.9,deck.y+i);}ctx.stroke();}
    const sides=[['north',deck.x,deck.y,deck.x+deck.width,deck.y],['east',deck.x+deck.width,deck.y,deck.x+deck.width,deck.y+deck.height],['south',deck.x,deck.y+deck.height,deck.x+deck.width,deck.y+deck.height],['west',deck.x,deck.y,deck.x,deck.y+deck.height]];
    ctx.strokeStyle='#283439';ctx.lineWidth=.16;
    for(const [side,x1,y1,x2,y2] of sides)if(side!==deck.open){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    ctx.strokeStyle='#c7d3d2';ctx.lineWidth=.05;
    for(const [side,x1,y1,x2,y2] of sides)if(side!==deck.open){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  }
  ctx.save();ctx.translate(.18,.28);path(ctx,points);ctx.fillStyle='rgba(0,0,0,.48)';ctx.fill();ctx.restore();
  // Sichtbare Südseite erzeugt Tiefe bei Gebäuden am oberen Rand und in der Szenenmitte.
  const south=points.map((a,i)=>[a,points[(i+1)%points.length]]).find(([a,b])=>a[1]===height&&b[1]===height);
  if(south){const [[a,y],[b]]=south;ctx.fillStyle='#303737';ctx.fillRect(Math.min(a,b),y,Math.abs(a-b),.43);ctx.fillStyle='#8b918c';ctx.fillRect(Math.min(a,b),y,Math.abs(a-b),.07);ctx.strokeStyle='#141a1d';ctx.lineWidth=.035;for(let x=Math.min(a,b)+1;x<Math.max(a,b);x+=1){ctx.beginPath();ctx.moveTo(x,y+.08);ctx.lineTo(x,y+.4);ctx.stroke();}}
  path(ctx,points);ctx.save();ctx.clip();
  const pattern=ctx.createPattern(image,'repeat');if(!pattern)throw new Error('Dachtextur konnte nicht geladen werden.');
  // Der Kontext arbeitet bereits in Metern.
  pattern.setTransform(new DOMMatrix().scale(asset.widthMeters/image.width,asset.heightMeters/image.height));
  ctx.fillStyle=pattern;ctx.fill();ctx.fillStyle='rgba(15,20,20,.17)';ctx.fill();ctx.restore();
  // Durchgehende Polylinie verbindet gerade Stücke und Innen-/Außenecken ohne Fugen.
  path(ctx,points);ctx.strokeStyle='#1a2225';ctx.lineWidth=.43;ctx.stroke();
  path(ctx,points);ctx.strokeStyle='#777c78';ctx.lineWidth=.30;ctx.stroke();
  path(ctx,points);ctx.strokeStyle='#bdc2ba';ctx.lineWidth=.10;ctx.stroke();
  return {surface,frame,points,deck};
}
function check(scene,level){
  if(!game.user.isGM||Number(game.release?.generation)!==14)throw new Error('Gebäude bauen benötigt die Spielleitung und Foundry 14.');
  if(!canvas.ready||canvas.scene!==scene||!level?.id||canvas.level?.id!==level.id)throw new Error('Szene oder Ebene wurde gewechselt. Bitte das Werkzeug neu öffnen.');
}
async function saveBuilding({scene,level,bounds,ppm,shape,balcony,asset,image,cancelled=()=>false}){
  const valid=()=>{check(scene,level);if(cancelled())throw new Error('Gebäudewerkzeug wurde geschlossen. Bitte erneut platzieren.');};
  valid();
  const world=game.world.id;if(!/^[\w-]+$/.test(world))throw new Error('Ungültiger Weltordner.');
  const {surface,frame}=renderBuilding({bounds,ppm,shape,balcony,asset,image});
  const picker=foundry.applications.apps.FilePicker.implementation,folder=`worlds/${world}/${ID}-buildings`;
  try{await picker.browse('data',folder);}catch{try{await picker.createDirectory('data',folder);}catch{await picker.browse('data',folder);}}
  valid();const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));if(!blob)throw new Error('Gebäude konnte nicht gerendert werden.');
  valid();const result=await picker.upload('data',folder,new File([blob],`roof-${crypto.randomUUID()}.png`,{type:'image/png'}),{},{notify:false});
  if(!result?.path||result.error)throw new Error(result?.error||'Upload fehlgeschlagen.');
  valid();
  const data={name:`Gebäude: ${asset.name}`,texture:{src:result.path,anchorX:0,anchorY:0},...frame,rotation:0,hidden:false,locked:false,
    elevation:level.elevation?.bottom??0,levels:[level.id],flags:{[ID]:{building:true,material:asset.key,shape,balcony,footprint:bounds}}};
  const [tile]=await scene.createEmbeddedDocuments('Tile',[stackedTile(data,scene.tiles,level.id)]);
  if(!tile)throw new Error('Gebäude-Tile konnte nicht angelegt werden.');
  history.push({scene,levelId:level.id,id:tile.id});return tile;
}
export async function showBuildings(){
  closeBuildings();(await import('./rows.mjs')).closeRows();(await import('./brush.mjs')).closeBrush();
  const request=opening,scene=canvas.scene,level=canvas.level;check(scene,level);
  const ppm=pixelsPerMeter(scene.grid),rect={...canvas.dimensions.sceneRect};
  const catalog=await loadCatalog();if(request!==opening)return;check(scene,level);
  const materials=roofMaterials.map(([key,label])=>({asset:catalog.find(a=>a.key===key),label}));
  if(materials.some(x=>!x.asset))throw new Error('Eine Dachtextur fehlt im Asset-Katalog.');
  const node=(tag,label)=>{const el=document.createElement(tag);if(label)el.textContent=label;return el;};
  const panel=node('section');panel.className='ssb-building-panel';panel.tabIndex=-1;panel.append(node('strong','SprawlBuilder · Gebäude bauen'));
  const material=node('select');material.setAttribute('aria-label','Dachmaterial');
  for(const m of materials)material.append(new Option(m.label,m.asset.key));
  const gallery=node('div');gallery.className='ssb-roof-gallery';
  for(const m of materials){const button=node('button',m.label),img=node('img');img.src=assetPath(m.asset);img.alt='';button.prepend(img);button.type='button';button.addEventListener('click',()=>{material.value=m.asset.key;update();});gallery.append(button);}
  const shape=node('select');shape.setAttribute('aria-label','Gebäudeform');shape.append(new Option('Rechteck','rectangle'),new Option('L-Form','l'));
  const balcony=node('select');balcony.setAttribute('aria-label','Balkonseite');for(const [v,label] of [['none','Kein Balkon'],['north','Balkon oben'],['south','Balkon unten'],['east','Balkon rechts'],['west','Balkon links']])balcony.append(new Option(label,v));
  const status=node('p','Auf der Karte klicken und eine Grundfläche aufziehen (3–40 m). Rechtsklick pausiert; Esc schließt.');status.setAttribute('aria-live','polite');
  const undo=node('button','Letztes Gebäude zurücknehmen'),close=node('button','Schließen');
  panel.append(node('span','Dachmaterial'),gallery,material,shape,balcony,status,undo,close);
  const overlay=node('canvas');overlay.className='ssb-building-overlay';document.body.append(overlay,panel);
  const stopMoving=movablePanel(panel,'buildings'),controller=new AbortController(),opts={signal:controller.signal};
  let pointer=null,start=null,end=null,busy=false,paused=false,disposed=false;
  const hooks=[['canvasTearDown',Hooks.on('canvasTearDown',dispose)],['canvasReady',Hooks.on('canvasReady',dispose)],['canvasPan',Hooks.on('canvasPan',()=>{start=end=null;pointer=null;clear();})]];
  function dispose(){if(disposed)return;disposed=true;stopMoving();controller.abort();for(const [event,id] of hooks)Hooks.off(event,id);overlay.remove();panel.remove();if(active?.dispose===dispose)active=null;}
  active={dispose};
  function clear(){overlay.getContext('2d').clearRect(0,0,overlay.width,overlay.height);}
  function resize(){overlay.width=innerWidth;overlay.height=innerHeight;start=end=null;pointer=null;clear();}
  resize();window.addEventListener('resize',resize,opts);
  function update(){for(const button of gallery.children)button.setAttribute('aria-pressed',String(button.textContent===materials.find(m=>m.asset.key===material.value)?.label));preview();}
  function world(e){return canvas.canvasCoordinatesFromClient({x:e.clientX,y:e.clientY});}
  function preview(){clear();if(!start||!end||paused)return;try{
    check(scene,level);const bounds=rectangleBounds(start,end,ppm,rect),w=bounds.width/ppm,h=bounds.height/ppm,points=roofOutline(w,h,shape.value),deck=balconyBounds(points,balcony.value);
    const ctx=overlay.getContext('2d'),toScreen=(x,y)=>canvas.clientCoordinatesFromCanvas({x:bounds.x+x*ppm,y:bounds.y+y*ppm});
    function polygon(p){ctx.beginPath();p.forEach(([x,y],i)=>{const v=toScreen(x,y);if(!i)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);});ctx.closePath();}
    if(deck){const a=toScreen(deck.x,deck.y),b=toScreen(deck.x+deck.width,deck.y+deck.height);ctx.fillStyle='rgba(210,185,145,.55)';ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);}
    polygon(points);ctx.fillStyle='rgba(110,165,165,.45)';ctx.fill();ctx.strokeStyle='#ddf5df';ctx.lineWidth=3;ctx.stroke();
    status.textContent=`${w} × ${h} m · ${shape.value==='l'?'L-Form':'Rechteck'} · ${level.id}`;
  }catch(error){status.textContent=error.message;}}
  update();
  material.addEventListener('change',update,opts);shape.addEventListener('change',preview,opts);balcony.addEventListener('change',preview,opts);
  overlay.addEventListener('pointerdown',e=>{if(paused||busy||e.button!==0)return;e.preventDefault();pointer=e.pointerId;start=end=world(e);overlay.setPointerCapture(pointer);preview();},opts);
  overlay.addEventListener('pointermove',e=>{if(paused||busy)return;if(pointer===e.pointerId){end=world(e);preview();}},opts);
  overlay.addEventListener('pointerleave',()=>{if(pointer===null){start=end=null;clear();}},opts);
  overlay.addEventListener('pointercancel',()=>{pointer=null;start=end=null;clear();},opts);
  overlay.addEventListener('pointerup',async e=>{if(e.button!==0||pointer!==e.pointerId||!start||busy)return;
    end=world(e);pointer=null;busy=true;for(const el of [material,shape,balcony,undo,close])el.disabled=true;
    try{check(scene,level);const bounds=rectangleBounds(start,end,ppm,rect),selected=materials.find(m=>m.asset.key===material.value).asset;
      roofOutline(bounds.width/ppm,bounds.height/ppm,shape.value);
      const image=new Image();image.src=assetPath(selected);await image.decode();if(disposed)return;
      await saveBuilding({scene,level,bounds,ppm,shape:shape.value,balcony:balcony.value,asset:selected,image,cancelled:()=>disposed});if(!disposed)status.textContent='Gebäude gesetzt. Weitere Grundfläche aufziehen oder rückgängig machen.';
    }catch(error){status.textContent=error.message;ui.notifications.error(error.message);}finally{busy=false;start=end=null;clear();for(const el of [material,shape,balcony,undo,close])el.disabled=false;}
  },opts);
  undo.addEventListener('click',async()=>{if(busy)return;busy=true;undo.disabled=true;try{check(scene,level);const i=history.findLastIndex(h=>h.scene===scene&&h.levelId===level.id);if(i<0)throw new Error('Kein eigenes Gebäude auf dieser Ebene zum Zurücknehmen.');const h=history[i];if(scene.tiles.get(h.id)?.flags?.[ID]?.building)await scene.deleteEmbeddedDocuments('Tile',[h.id]);history.splice(i,1);status.textContent='Gebäude zurückgenommen.';}catch(error){status.textContent=error.message;}finally{busy=false;undo.disabled=false;}},opts);
  close.addEventListener('click',dispose,opts);
  for(const target of [overlay,panel])target.addEventListener('contextmenu',e=>{e.preventDefault();e.stopImmediatePropagation();paused=true;start=end=null;pointer=null;clear();status.textContent='Pausiert. Linksklick auf „Fortsetzen“.';resume.hidden=false;},opts);
  const resume=node('button','Fortsetzen');resume.hidden=true;resume.addEventListener('click',()=>{paused=false;resume.hidden=true;status.textContent='Grundfläche aufziehen.';},opts);panel.insertBefore(resume,undo);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dispose();}},{...opts,capture:true});
}
