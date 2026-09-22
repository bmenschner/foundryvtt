import {ID} from './catalog.mjs';
import {tileRectangle} from './snapping.mjs';
let catalog=new Map();
export function setStackCatalog(assets){catalog=new Map(assets.map(a=>[a.key,a]));}
const rawSort=tile=>Number.isFinite(tile.sort)?tile.sort:0;
export function onLevel(tile,levelId){
  if(typeof tile.includedInLevel==='function')return tile.includedInLevel(levelId);
  const levels=tile.levels;
  return !levels||!(levels.size??levels.length)||(levels.has?.(levelId)||levels.includes?.(levelId));
}
function stackScene(tiles,levelId,assets,excludeId){
  const values=tiles instanceof Map?tiles.values():tiles??[];
  const nodes=Array.from(values).filter(t=>!(excludeId&&(t.id??t._id)===excludeId)&&!t.hidden&&(t.alpha??1)>0&&onLevel(t,levelId))
    .map(tile=>({tile,shape:tileRectangle(tile,assets),sort:rawSort(tile)})).filter(n=>n.shape);
  const depths=new Map();
  function depth(node){
    if(depths.has(node))return depths.get(node);
    const mode=node.tile.flags?.[ID]?.stack;
    let value=mode?.automatic===false&&Number.isSafeInteger(mode.step)?Math.max(0,mode.step):0;
    if(mode?.automatic!==false)for(const lower of nodes)if(lower.sort<node.sort&&overlaps(node.shape,lower.shape))value=Math.max(value,depth(lower)+1);
    depths.set(node,value);return value;
  }
  return {nodes,depth};
}
export function stackLevel(tile){
  const mode=tile.flags?.[ID]?.stack;
  if(mode?.automatic===false&&Number.isSafeInteger(mode.step))return Math.max(0,mode.step);
  const board=globalThis.canvas;
  if(tile.parent&&tile.parent===board?.scene){
    const scene=stackScene(board.scene.tiles,board.level?.id,catalog);
    const node=scene.nodes.find(n=>(n.tile.id??n.tile._id)===(tile.id??tile._id));
    if(node)return scene.depth(node);
  }
  return Number.isSafeInteger(mode?.step)?Math.max(0,mode.step):0;
}
export const stackMode=tile=>({automatic:tile.flags?.[ID]?.stack?.automatic??true,step:stackLevel(tile)});
function corners(b){
  const a=b.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:b.x+c*x*b.width/2-s*y*b.height/2,y:b.y+s*x*b.width/2+c*y*b.height/2}));
}
export function overlaps(a,b){
  if(Math.hypot(a.x-b.x,a.y-b.y)>Math.hypot(a.width,a.height)/2+Math.hypot(b.width,b.height)/2)return false;
  const p=corners(a),q=corners(b);
  for(const r of [p,q])for(let i=0;i<2;i++){
    const dx=r[i+1].x-r[i].x,dy=r[i+1].y-r[i].y,len=Math.hypot(dx,dy),axis={x:-dy/len,y:dx/len};
    const x=p.map(v=>v.x*axis.x+v.y*axis.y),y=q.map(v=>v.x*axis.x+v.y*axis.y);
    if(Math.min(Math.max(...x),Math.max(...y))-Math.max(Math.min(...x),Math.min(...y))<=1e-7)return false;
  }
  return true;
}
export function stackedTile(tile,tiles,levelId,{mode=stackMode(tile),assets=catalog,excludeId=tile.id??tile._id}={}){
  if(!mode.automatic&&(!Number.isSafeInteger(mode.step)||mode.step<0))throw new Error('Die Stufe muss eine nichtnegative ganze Zahl sein.');
  let step=mode.automatic?0:mode.step,sort=mode.automatic?0:mode.step;
  if(mode.automatic){
    const shape=tileRectangle(tile,assets),scene=stackScene(tiles,levelId,assets,excludeId);
    for(const node of scene.nodes)if(shape&&overlaps(shape,node.shape)){
      step=Math.max(step,scene.depth(node)+1);sort=Math.max(sort,Math.floor(node.sort)+1);
    }
  }
  if(mode.automatic)sort=Math.max(sort,step);
  if(!Number.isSafeInteger(step)||!Number.isSafeInteger(sort))throw new Error('Die Stapelstufe ist zu groß.');
  return {...tile,sort,flags:{...tile.flags,[ID]:{...tile.flags?.[ID],stack:{automatic:!!mode.automatic,step}}}};
}
export function stackUpdate(doc,update,tiles,levelId,mode=stackMode(doc)){
  const tile=stackedTile({...doc.toObject(),...update},tiles,levelId,{mode,excludeId:doc.id});
  return {...update,sort:tile.sort,[`flags.${ID}.stack`]:tile.flags[ID].stack};
}
export function stackControls(initial={automatic:true,step:0},onChange=()=>{}){
  const node=document.createElement('div');node.className='ssb-stack-controls';
  const autoLabel=document.createElement('label');autoLabel.textContent='Automatisch stapeln';
  const automatic=document.createElement('input');automatic.type='checkbox';automatic.setAttribute('aria-label','Automatisch stapeln');autoLabel.append(automatic);
  const stepLabel=document.createElement('label');stepLabel.textContent='Stufe';
  const step=document.createElement('input');step.type='number';step.min='0';step.step='1';step.setAttribute('aria-label','Stufe');stepLabel.append(step);node.append(autoLabel,stepLabel);
  const buttons=document.createElement('div');buttons.className='ssb-stack-buttons';
  const minus=document.createElement('button'),plus=document.createElement('button');
  for(const [button,text,label] of [[minus,'−','Stufe verringern'],[plus,'+','Stufe erhöhen']]){button.type='button';button.textContent=text;button.title=label;button.setAttribute('aria-label',label);buttons.append(button);}
  node.append(buttons);let disabled=false;
  const read=()=>({automatic:automatic.checked,step:Number(step.value)});
  function refresh(){automatic.disabled=disabled;step.disabled=disabled||automatic.checked;minus.disabled=disabled||Number(step.value)<=0;plus.disabled=disabled||Number(step.value)>=Number.MAX_SAFE_INTEGER;}
  function sync(mode){automatic.checked=mode.automatic;step.value=String(mode.step);refresh();}
  function adjust(delta){const value=Number(step.value);if(disabled||!Number.isSafeInteger(value)||value<0)return;sync({automatic:false,step:Math.max(0,value+delta)});onChange(read());}
  minus.addEventListener('click',()=>adjust(-1));plus.addEventListener('click',()=>adjust(1));
  automatic.addEventListener('change',()=>{refresh();onChange(read());});step.addEventListener('change',()=>{refresh();onChange(read());});sync(initial);
  return {node,read,sync,show:values=>{if(automatic.checked){step.value=String(Math.max(0,...values));refresh();}},disable:value=>{disabled=value;refresh();}};
}

export function updateMovedStack(doc,changes,options={},userId){
  const board=globalThis.canvas,selected=board?.tiles?.controlled??[];
  if(!globalThis.game?.user?.isGM||userId!==(game.user.id??game.userId)||options.isUndo||!board?.ready
    ||doc.parent!==board.scene||!doc.flags?.[ID]||doc.locked||!onLevel(doc,board.level?.id)
    ||selected.length!==1||selected[0].document?.id!==doc.id||!stackMode(doc).automatic)return;
  if(!['x','y'].some(k=>Number.isFinite(changes[k])&&changes[k]!==doc[k]))return;
  if(['width','height','rotation','elevation','levels'].some(k=>k in changes))return;
  // Runs synchronously before persistence, also for movement paths without our preview adapter.
  Object.assign(changes,stackUpdate(doc,changes,board.scene.tiles,board.level.id));
}
