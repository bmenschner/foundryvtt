import {ID} from './catalog.mjs';
import {recordHistory} from './brush.mjs';
import {tileBounds} from './resize.mjs';

export function intersections(bounds,areas){
  return areas.map(a=>{const x=Math.max(bounds.x,a.x),y=Math.max(bounds.y,a.y);
    return {x,y,width:Math.min(bounds.x+bounds.width,a.x+a.width)-x,height:Math.min(bounds.y+bounds.height,a.y+a.height)-y};
  }).filter(a=>a.width>1e-7&&a.height>1e-7);
}
const snapshot=tile=>tile.toObject();
const fingerprint=tile=>{const data=snapshot(tile);delete data._stats;return JSON.stringify(data);};
export function eraseCandidates(tiles,levelId,areas){
  const candidates=[],skipped=[];
  for(const tile of tiles){
    if(!tile.flags?.[ID]?.painted||!(tile.levels?.has?.(levelId)||tile.levels?.includes?.(levelId)))continue;
    const cuts=intersections(tileBounds(tile),areas);if(!cuts.length)continue;
    if(tile.locked||tile.rotation){skipped.push(tile);continue;}
    candidates.push({tile,cuts});
  }
  return {candidates,skipped};
}
export function eraseImage(image,bounds,cuts){
  const surface=document.createElement('canvas');surface.width=image.naturalWidth||image.width;surface.height=image.naturalHeight||image.height;
  const ctx=surface.getContext('2d');ctx.drawImage(image,0,0);
  for(const cut of cuts)ctx.clearRect((cut.x-bounds.x)*surface.width/bounds.width,(cut.y-bounds.y)*surface.height/bounds.height,cut.width*surface.width/bounds.width,cut.height*surface.height/bounds.height);
  const pixels=ctx.getImageData(0,0,surface.width,surface.height).data;
  let empty=true;for(let i=3;i<pixels.length;i+=4)if(pixels[i]){empty=false;break;}
  return {surface,empty};
}
export async function eraseTerrain({scene,level,areas}){
  function valid(){if(!game.user.isGM||Number(game.release?.generation)!==14||!canvas.ready||canvas.scene!==scene||!level?.id||canvas.level?.id!==level.id)throw new Error('Szene, Ebene oder Berechtigung geändert. Bitte erneut radieren.');}
  valid();
  const {candidates,skipped}=eraseCandidates(Array.from(scene.tiles??[]),level.id,areas),plans=[];
  const world=game.world.id;if(!/^[\w-]+$/.test(world))throw new Error('Ungültiger Weltordner.');
  const picker=foundry.applications.apps.FilePicker.implementation,folder=`worlds/${world}/${ID}-painted`;
  for(const {tile,cuts} of candidates){
    const before=snapshot(tile),original=fingerprint(tile),image=new Image();image.src=tile.texture.src;await image.decode();valid();
    const {surface,empty}=eraseImage(image,tileBounds(tile),cuts);
    let src;
    if(!empty){
      const blob=await new Promise(resolve=>surface.toBlob(resolve,'image/png'));if(!blob)throw new Error('Radiermaske konnte nicht gespeichert werden.');
      valid();const result=await picker.upload('data',folder,new File([blob],`erase-${crypto.randomUUID()}.png`,{type:'image/png'}),{},{notify:false});
      if(!result?.path||result.error)throw new Error(result?.error||'Upload fehlgeschlagen.');src=result.path;
    }
    plans.push({tile,before,original,src,empty});
  }
  valid();
  if(plans.some(p=>scene.tiles.get(p.tile.id)!==p.tile||fingerprint(p.tile)!==p.original))throw new Error('Eine Bodenfläche wurde zwischenzeitlich verändert. Bitte erneut radieren.');
  const applied=[];
  // Keep successful operations undoable even if a later document write fails.
  const entry={scene,levelId:level.id,async undo(){
    valid();
    if(applied.some(p=>p.empty?scene.tiles.get(p.tile.id):!scene.tiles.get(p.tile.id)||fingerprint(scene.tiles.get(p.tile.id))!==p.after))throw new Error('Eine betroffene Fläche wurde zwischenzeitlich verändert. Rückgängig würde Änderungen überschreiben.');
    while(applied.length){const p=applied.at(-1);valid();
      if(p.empty)await scene.createEmbeddedDocuments('Tile',[p.before],{keepId:true});
      else await scene.updateEmbeddedDocuments('Tile',[{_id:p.tile.id,'texture.src':p.before.texture.src}]);
      applied.pop();
    }
  }};
  for(const p of plans){
    valid();if(fingerprint(p.tile)!==p.original)throw new Error('Eine Bodenfläche wurde zwischenzeitlich verändert.');
    if(p.empty)await scene.deleteEmbeddedDocuments('Tile',[p.tile.id]);
    else await scene.updateEmbeddedDocuments('Tile',[{_id:p.tile.id,'texture.src':p.src}]);
    p.after=p.empty?null:fingerprint(scene.tiles.get(p.tile.id));applied.push(p);if(applied.length===1)recordHistory(entry);
  }
  return {changed:plans.length,skipped:skipped.length};
}
