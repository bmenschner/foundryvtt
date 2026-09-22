import {stackedTile} from './stacking.mjs';
import {ID} from './catalog.mjs';
import {renderStroke,recordHistory} from './brush.mjs';
const textures=new Map();
const cellIndex=(point,ppm,rect)=>({x:Math.floor((point.x-rect.x)/ppm),y:Math.floor((point.y-rect.y)/ppm)});
export function rectangleBounds(start,end,ppm,rect){
  if(!Number.isFinite(ppm)||ppm<=0||![start?.x,start?.y,end?.x,end?.y,rect?.x,rect?.y,rect?.width,rect?.height].every(Number.isFinite))throw new Error('Ungültige Rechteckkoordinaten.');
  const a=cellIndex(start,ppm,rect),b=cellIndex(end,ppm,rect);
  const left=Math.max(0,Math.min(a.x,b.x)),top=Math.max(0,Math.min(a.y,b.y));
  const right=Math.min(Math.floor((rect.width+1e-7)/ppm),Math.max(a.x,b.x)+1),bottom=Math.min(Math.floor((rect.height+1e-7)/ppm),Math.max(a.y,b.y)+1);
  if(right<=left||bottom<=top)throw new Error('Bitte vollständige 1-m-Felder innerhalb der Szene wählen.');
  return {x:rect.x+left*ppm,y:rect.y+top*ppm,width:(right-left)*ppm,height:(bottom-top)*ppm};
}
export function stampCells(points,ppm,rect,limit=512){
  if(!Number.isFinite(ppm)||ppm<=0||!points.length||points.length>10000||!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))throw new Error('Ungültige Stempelkoordinaten.');
  const cells=new Map(),index=p=>cellIndex(p,ppm,rect);
  function add(x,y){const key=`${x},${y}`,cell={x:rect.x+x*ppm,y:rect.y+y*ppm,width:ppm,height:ppm};
    if(cell.x<rect.x||cell.y<rect.y||cell.x+ppm>rect.x+rect.width+1e-7||cell.y+ppm>rect.y+rect.height+1e-7)return;
    if(!cells.has(key)&&cells.size>=limit)throw new Error(`Höchstens ${limit} Felder pro Zug. Bitte in Abschnitten setzen.`);cells.set(key,cell);}
  const first=index(points[0]);add(first.x,first.y);
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],start=index(a),end=index(b),dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy);
    let x=start.x,y=start.y,tx=dx?(rect.x+(x+(sx>0?1:0))*ppm-a.x)/dx:Infinity,ty=dy?(rect.y+(y+(sy>0?1:0))*ppm-a.y)/dy:Infinity,steps=0;
    while(x!==end.x||y!==end.y){if(++steps>20000)throw new Error('Mausweg zu lang. Bitte innerhalb der Szene setzen.');
      if(x!==end.x&&(y===end.y||tx<=ty)){x+=sx;tx+=ppm/Math.abs(dx);}else {y+=sy;ty+=ppm/Math.abs(dy);}add(x,y);}
  }
  return [...cells.values()];
}
export async function saveStamps({scene,level,asset,cells,ppm,image,stack}){
  function valid(){if(!game.user.isGM||Number(game.release?.generation)!==14||!canvas.ready||canvas.scene!==scene||canvas.level?.id!==level.id)throw new Error('Szene, Ebene oder Berechtigung geändert. Bitte erneut setzen.');}
  valid();if(!cells.length)throw new Error('Bitte innerhalb der Szene setzen.');
  const world=game.world.id;if(!/^[\w-]+$/.test(world))throw new Error('Ungültiger Weltordner.');
  const picker=foundry.applications.apps.FilePicker.implementation,folder=`worlds/${world}/${ID}-painted`;
  try{await picker.browse('data',folder);}catch{try{await picker.createDirectory('data',folder);}catch{await picker.browse('data',folder);}}
  const group=crypto.randomUUID(),data=[];
  const phase=(n,period)=>(((n%period)+period)%period).toFixed(6);
  for(const cell of cells){
    valid();const key=[world,asset.key,asset.sha256,ppm,phase(cell.x,asset.widthMeters*ppm),phase(cell.y,asset.heightMeters*ppm)].join('|');
    let src=textures.get(key);
    if(!src){const surface=renderStroke({points:[cell],diameter:ppm,mode:'rectangle',bounds:cell,ppm,asset,image});
      const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));if(!blob)throw new Error('Stempelbild konnte nicht erzeugt werden.');valid();
      const result=await picker.upload('data',folder,new File([blob],`${asset.key}-stamp-${crypto.randomUUID()}.png`,{type:'image/png'}),{},{notify:false});
      if(!result?.path||result.error)throw new Error(result?.error||'Upload fehlgeschlagen.');src=result.path;textures.set(key,src);}
    data.push({...cell,name:`1 m: ${asset.name}`,texture:{src,anchorX:0,anchorY:0},rotation:0,hidden:false,locked:false,elevation:level.elevation?.bottom??0,levels:[level.id],flags:{[ID]:{painted:true,stamp:true,key:asset.key,group}}});
  }
  valid();const placed=data.map(t=>stackedTile(t,scene.tiles,level.id,{mode:stack}));
  const created=await scene.createEmbeddedDocuments('Tile',placed);
  if(created?.length)recordHistory({scene,levelId:level.id,ids:created.map(t=>t.id)});
  if(created?.length!==data.length)throw new Error('Nicht alle Felder wurden angelegt. Rückgängig entfernt die bereits angelegten Felder dieses Zuges.');
  return created;
}
