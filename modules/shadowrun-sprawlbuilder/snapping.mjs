import {ID} from './catalog.mjs';
const radians=a=>a*Math.PI/180;
export function tileRectangle(tile,assets){
  if(![tile.x,tile.y,tile.width,tile.height].every(Number.isFinite)||tile.width<=0||tile.height<=0)return null;
  const asset=assets.get(tile.flags?.[ID]?.key),painted=tile.flags?.[ID]?.painted;
  const bounds=asset&&!painted?asset.alphaBounds:[0,0,1,1],pw=asset&&!painted?asset.pixelWidth:1,ph=asset&&!painted?asset.pixelHeight:1;
  const [l,t,r,b]=bounds,rotation=tile.rotation??0,c=Math.cos(radians(rotation)),s=Math.sin(radians(rotation));
  const ox=((l+r)/2/pw-(tile.texture?.anchorX??tile.anchorX??.5))*tile.width,oy=((t+b)/2/ph-(tile.texture?.anchorY??tile.anchorY??.5))*tile.height;
  return {id:tile.id,x:tile.x+c*ox-s*oy,y:tile.y+s*ox+c*oy,width:(r-l)/pw*tile.width,height:(b-t)/ph*tile.height,rotation};
}
export function snapTargets(tiles,assets,levelId){return Array.from(tiles).filter(t=>!t.hidden&&(t.levels?.has?.(levelId)||t.levels?.includes?.(levelId))).map(t=>tileRectangle(t,assets)).filter(Boolean);}
export function snapToEdges({point,width,height,rotation=0,targets,zoom=1,previous=null}){
  const free={point,rotation,match:null};if(!Number.isFinite(zoom)||zoom<=0)return free;
  const candidates=[];
  for(const target of targets){
    const a=radians(target.rotation),c=Math.cos(a),s=Math.sin(a),dx=point.x-target.x,dy=point.y-target.y;
    const local={x:c*dx+s*dy,y:-s*dx+c*dy};
    const quarter=Math.round((rotation-target.rotation)/90),angle=target.rotation+quarter*90;
    const w=Math.abs(quarter%2)?height:width,h=Math.abs(quarter%2)?width:height;
    for(let side=0;side<4;side++){
      const horizontal=side%2===0,sign=side<2?1:-1;
      const n=horizontal?'x':'y',t=horizontal?'y':'x',edge=(horizontal?target.width:target.height)/2*sign;
      const halfNormal=(horizontal?w:h)/2,halfTangent=(horizontal?h:w)/2,halfEdge=(horizontal?target.height:target.width)/2;
      const key=`${target.id}:${side}`,threshold=(previous===key?20:12)/zoom;
      const normal=edge+sign*halfNormal,distance=Math.abs(normal-local[n]);
      if(distance>threshold||Math.abs(local[t])>halfEdge+halfTangent)continue;
      let tangent=local[t];
      const ends=[-halfEdge+halfTangent,halfEdge-halfTangent].sort((x,y)=>Math.abs(x-tangent)-Math.abs(y-tangent));
      if(Math.abs(ends[0]-tangent)<=12/zoom)tangent=ends[0];
      const p=horizontal?{x:normal,y:tangent}:{x:tangent,y:normal};
      const world=p=>({x:target.x+c*p.x-s*p.y,y:target.y+s*p.x+c*p.y});
      const e1=horizontal?{x:edge,y:-halfEdge}:{x:-halfEdge,y:edge},e2=horizontal?{x:edge,y:halfEdge}:{x:halfEdge,y:edge};
      candidates.push({point:world(p),rotation:((angle%360)+360)%360,match:{key,targetId:target.id,edge:[world(e1),world(e2)]},score:distance+(Math.abs(tangent-local[t])*.1)});
    }
  }
  return candidates.find(c=>c.match.key===previous)??candidates.sort((a,b)=>a.score-b.score||a.match.key.localeCompare(b.match.key))[0]??free;
}
