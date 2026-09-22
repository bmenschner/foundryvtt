import {ID} from './catalog.mjs';
import {tileRectangle} from './snapping.mjs';
let catalog=new Map();
export function setStackCatalog(assets){catalog=new Map(assets.map(a=>[a.key,a]));}
export const stackLevel=tile=>Math.max(0,Number.isFinite(tile.sort)?Math.ceil(tile.sort):0);
export const stackMode=tile=>({automatic:tile.flags?.[ID]?.stack?.automatic??true,step:stackLevel(tile)});
function corners(b){
  const a=b.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:b.x+c*x*b.width/2-s*y*b.height/2,y:b.y+s*x*b.width/2+c*y*b.height/2}));
}
export function overlaps(a,b){
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
  let step=mode.automatic?0:mode.step;
  if(mode.automatic){
    const shape=tileRectangle(tile,assets);
    const candidates=tiles instanceof Map?tiles.values():tiles??[];
    for(const other of candidates){
      if((excludeId&&(other.id??other._id)===excludeId)||other.hidden||(other.alpha??1)<=0
        ||!(other.levels?.has?.(levelId)||other.levels?.includes?.(levelId))||(other.elevation??0)!==(tile.elevation??0))continue;
      const target=tileRectangle(other,assets);
      if(shape&&target&&overlaps(shape,target))step=Math.max(step,stackLevel(other)+1);
    }
  }
  if(!Number.isSafeInteger(step))throw new Error('Die Stapelstufe ist zu groß.');
  return {...tile,sort:step,flags:{...tile.flags,[ID]:{...tile.flags?.[ID],stack:{automatic:!!mode.automatic,step}}}};
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
  const read=()=>({automatic:automatic.checked,step:Number(step.value)});
  function sync(mode){automatic.checked=mode.automatic;step.value=String(mode.step);step.disabled=automatic.checked;}
  automatic.addEventListener('change',()=>{step.disabled=automatic.checked;onChange(read());});step.addEventListener('change',()=>onChange(read()));sync(initial);
  return {node,read,sync,show:values=>{if(automatic.checked)step.value=String(Math.max(0,...values));},disable:value=>{automatic.disabled=value;step.disabled=value||automatic.checked;}};
}
