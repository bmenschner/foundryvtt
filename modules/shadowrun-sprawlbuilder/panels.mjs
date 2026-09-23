const namespace='shadowrun-sprawlbuilder';
const key=kind=>`${namespace}:panel:${game.world?.id??'world'}:${game.user?.id??'user'}:${kind}`;
export function clampPosition(position,size,viewport={width:innerWidth,height:innerHeight}) {
  return {left:Math.max(8,Math.min(position.left,Math.max(8,viewport.width-size.width-8))),
    top:Math.max(8,Math.min(position.top,Math.max(8,viewport.height-size.height-8)))};
}
export function readPosition(kind){try{const p=JSON.parse(localStorage.getItem(key(kind)));return p&&Number.isFinite(p.left)&&Number.isFinite(p.top)?{left:p.left,top:p.top}:null;}catch{return null;}}
export function savePosition(kind,position){try{localStorage.setItem(key(kind),JSON.stringify({left:position.left,top:position.top}));}catch{/* A disabled browser store must not disable dragging. */}}
export function movablePanel(panel,kind){
  const title=panel.querySelector('strong'),header=document.createElement('header'),reset=document.createElement('button');
  header.className='ssb-panel-header';header.setAttribute('aria-label','Fenster verschieben');
  reset.type='button';reset.className='ssb-panel-reset';reset.textContent='↺';reset.title='Position zurücksetzen';reset.setAttribute('aria-label','Position zurücksetzen');
  header.append(title,reset);panel.prepend(header);
  const controller=new AbortController(),opts={signal:controller.signal};let drag=null;
  const position=()=>{const r=panel.getBoundingClientRect();return {left:r.left,top:r.top};};
  const defaults=()=>({left:innerWidth-panel.getBoundingClientRect().width-(innerWidth<=800?12:330),top:innerWidth<=800?60:80});
  const apply=p=>{const bounded=clampPosition(p,panel.getBoundingClientRect());Object.assign(panel.style,{left:`${bounded.left}px`,top:`${bounded.top}px`,right:'auto',bottom:'auto'});return bounded;};
  apply(readPosition(kind)??defaults());
  function finish(cancel=false){if(!drag)return;const current=drag;drag=null;if(cancel)apply(current.position);header.classList.remove('ssb-dragging');if(header.hasPointerCapture(current.id))header.releasePointerCapture(current.id);if(!cancel)savePosition(kind,position());}
  header.addEventListener('pointerdown',e=>{if(drag||e.button!==0||e.target.closest('button'))return;e.preventDefault();e.stopPropagation();drag={id:e.pointerId,x:e.clientX,y:e.clientY,position:position()};header.setPointerCapture(e.pointerId);header.classList.add('ssb-dragging');},opts);
  header.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();apply({left:drag.position.left+e.clientX-drag.x,top:drag.position.top+e.clientY-drag.y});},opts);
  header.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();finish();},opts);
  header.addEventListener('pointercancel',()=>finish(true),opts);
  header.addEventListener('lostpointercapture',()=>finish(true),opts);
  reset.addEventListener('click',()=>{finish(true);savePosition(kind,apply(defaults()));},opts);
  window.addEventListener('blur',()=>finish(true),opts);
  window.addEventListener('resize',()=>{finish(true);apply(position());},opts);
  return ()=>{finish(true);controller.abort();};
}

// Keep Foundry's native drag handling; listen only to its public position event.
export function rememberApplication(app,kind='assets'){
  const reset=()=>app.setPosition(clampPosition({left:(innerWidth-app.element.getBoundingClientRect().width)/2,top:80},app.element.getBoundingClientRect()));
  const saved=readPosition(kind);if(saved)app.setPosition(clampPosition(saved,app.element.getBoundingClientRect()));
  app.bringToFront();
  // Canvas paint overlays use z-index 50. Keep this window above them.
  if(Number(getComputedStyle(app.element).zIndex)<=50)app.setPosition({zIndex:51});
  const save=()=>savePosition(kind,app.position);
  const resize=()=>app.setPosition(clampPosition(app.position,app.element.getBoundingClientRect()));
  app.addEventListener('position',save);window.addEventListener('resize',resize);
  return {reset,dispose(){app.removeEventListener('position',save);window.removeEventListener('resize',resize);}};
}
