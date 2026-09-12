export const ID='assets-grimmes-erwachen';
const BASE=`modules/${ID}`;
export const categories={gastronomie:'Gastronomie',club:'Club',sport:'Sport',wohnen:'Wohnen',buero_medizin:'Büro und Medizin',industrie_verkehr:'Industrie und Verkehr',sakral_natur:'Sakral und Natur',bauteile:'Bauteile',boden:'Boden',strassen:'Straßen'};
let browser;

export const normalize=value=>String(value??'').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ß','ss');
export function filterAssets(icons,query='',category='') {
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  return icons.filter(a=>(!category || a.category===category) && words.every(w=>normalize(`${a.name} ${a.key} ${categories[a.category]}`).includes(w)));
}
export function assetPath(asset) {
  if (!/^assets\/[a-z_]+\/[a-z0-9-]+\.webp$/.test(asset.file)) throw new Error('Ungültiger Bildpfad.');
  return `${BASE}/${asset.file}`;
}
export function tileData(asset,{grid,rect,level},widthMeters=asset.widthMeters) {
  const units={m:1,meter:1,meters:1,metre:1,metres:1,cm:0.01,km:1000,ft:0.3048,feet:0.3048,foot:0.3048,yd:0.9144};
  const metres=units[normalize(grid.units).trim()];
  if (!metres || ![grid.size,grid.distance].every(n=>Number.isFinite(n) && n>0)) throw new Error('Bitte eine gültige Rasterdistanz und Einheit m, cm, km, ft oder yd in der Szene einstellen.');
  if (!Number.isFinite(widthMeters) || widthMeters<=0 || widthMeters>1000) throw new Error('Die Breite muss größer als 0 und höchstens 1000 m sein.');
  const [left,top,right,bottom]=asset.alphaBounds??[];
  if (![left,top,right,bottom,asset.pixelWidth,asset.pixelHeight].every(Number.isFinite) || left<0 || top<0 || right<=left || bottom<=top || right>asset.pixelWidth || bottom>asset.pixelHeight) throw new Error('Ungültige Bildabmessungen.');
  if (!rect || ![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite) || rect.width<=0 || rect.height<=0) throw new Error('Keine nutzbare Szenenfläche.');
  const scale=widthMeters*grid.size/(grid.distance*metres)/(right-left);
  return {name:asset.name,texture:{src:assetPath(asset)},width:asset.pixelWidth*scale,height:asset.pixelHeight*scale,
    x:rect.x+rect.width/2-(left+right)/2*scale,y:rect.y+rect.height/2-(top+bottom)/2*scale,
    anchorX:0,anchorY:0,rotation:0,hidden:false,locked:false,elevation:Number.isFinite(level?.elevation?.bottom)?level.elevation.bottom:0,
    levels:level?.id?[level.id]:[],flags:{[ID]:{key:asset.key,widthMeters}}};
}
export async function loadCatalog() {
  const response=await fetch(`${BASE}/catalog.json`,{cache:'no-store'});
  if (!response.ok) throw new Error('Der Bilderkatalog fehlt. Bitte das vollständige Asset-Modul installieren.');
  const catalog=await response.json();
  if (!Array.isArray(catalog.icons)) throw new Error('Ungültiger Bilderkatalog.');
  for(const asset of catalog.icons) assetPath(asset);
  return catalog.icons;
}
export async function placeAsset(asset,widthMeters=asset.widthMeters) {
  if (!game.user.isGM) throw new Error('Nur die Spielleitung kann Elemente platzieren.');
  if (Number(game.release?.generation)!==14) throw new Error('Die Platzierung benötigt Foundry 14.');
  const scene=canvas.scene,level=canvas.level;
  if (!scene || !canvas.ready) throw new Error('Bitte zuerst eine Szene öffnen.');
  if (!level?.id) throw new Error('Bitte zuerst eine Szenenebene auswählen.');
  const data=tileData(asset,{grid:scene.grid,rect:canvas.dimensions.sceneRect,level},widthMeters);
  const response=await fetch(data.texture.src,{method:'HEAD'});
  if (!response.ok) throw new Error('Die Bilddatei fehlt. Bitte das vollständige Asset-Modul installieren.');
  if (canvas.scene!==scene || canvas.level?.id!==level.id) throw new Error('Die Szene oder Ebene wurde gewechselt. Bitte erneut platzieren.');
  const [created]=await scene.createEmbeddedDocuments('Tile',[data]);
  if (!created) throw new Error('Das Element konnte nicht angelegt werden.');
  canvas.tiles?.activate();
  created.object?.control({releaseOthers:true});
  ui.notifications.info(`${asset.name} wurde in der Szenenmitte platziert.`);
  return created;
}

export function catalogElement(icons) {
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
  const root=node('section',undefined,'age-catalog');
  const intro=node('p',`${icons.length} Kartenelemente. Element auswählen, Breite festlegen und in der geöffneten Szene platzieren.`);
  const tools=node('div',undefined,'age-tools');
  const search=node('input');search.type='search';search.placeholder='Element suchen …';search.setAttribute('aria-label','Element suchen');
  const category=node('select');category.setAttribute('aria-label','Kategorie');category.append(new Option('Alle Kategorien',''));
  for(const [key,label] of Object.entries(categories)) category.append(new Option(label,key));
  const paint=node('button','Boden malen');paint.type='button';paint.addEventListener('click',()=>showBrush().catch(error=>ui.notifications.error(error.message)));
  tools.append(search,category,paint);
  const status=node('p');status.setAttribute('aria-live','polite');
  const cards=node('div',undefined,'age-cards');
  const paging=node('div',undefined,'age-tools');
  const previous=node('button','Zurück'),next=node('button','Weiter');previous.type=next.type='button';paging.append(previous,next);
  const detail=node('div',undefined,'age-detail');
  const selectedName=node('strong','Noch kein Element ausgewählt.');
  const sizeLabel=node('label','Sichtbare Breite (m) '),width=node('input');width.type='number';width.min='0.01';width.max='1000';width.step='0.01';width.disabled=true;sizeLabel.append(width);
  const place=node('button','In Szenenmitte platzieren');place.type='button';place.disabled=true;
  const pathLabel=node('label','Bildpfad '),path=node('input');path.readOnly=true;pathLabel.append(path);path.addEventListener('click',()=>path.select());
  detail.append(selectedName,sizeLabel,place,pathLabel,node('small','Die Breite bezieht sich auf das sichtbare Objekt. Seitenverhältnis und Transparenz bleiben erhalten. Maße sind Vorschläge. Anschließend auf der Tile-Ebene verschieben oder drehen.'));
  root.append(intro,tools,status,cards,paging,detail);
  let page=0,selected=null,placing=false;
  function draw() {
    const matches=filterAssets(icons,search.value,category.value),pages=Math.max(1,Math.ceil(matches.length/24));page=Math.min(page,pages-1);
    status.textContent=`${matches.length} Treffer · Seite ${page+1} von ${pages}`;
    previous.disabled=page===0;next.disabled=page>=pages-1;cards.replaceChildren();
    for(const asset of matches.slice(page*24,(page+1)*24)) {
      const card=node('button',undefined,'age-card');card.type='button';card.setAttribute('aria-label',asset.name);card.setAttribute('aria-pressed',String(selected?.key===asset.key));
      const picture=node('img');picture.src=assetPath(asset);picture.alt='';picture.loading='lazy';picture.width=120;picture.height=100;
      card.append(picture,node('span',asset.name));
      card.addEventListener('click',()=>{if(placing)return;selected=asset;selectedName.textContent=asset.name;width.disabled=false;width.value=String(asset.widthMeters);path.value=assetPath(asset);place.disabled=false;draw();});
      cards.append(card);
    }
  }
  search.addEventListener('input',()=>{page=0;draw();});category.addEventListener('change',()=>{page=0;draw();});
  previous.addEventListener('click',()=>{page--;draw();});next.addEventListener('click',()=>{page++;draw();});
  place.addEventListener('click',async()=>{if(!selected || placing)return;placing=true;place.disabled=true;try{await placeAsset(selected,Number(width.value));}catch(error){ui.notifications.error(error.message);}finally{placing=false;place.disabled=false;}});
  draw();return root;
}
export async function showCatalog() {
  if (!game.user.isGM) return;
  if (browser?.rendered) {browser.bringToFront();return browser;}
  const icons=await loadCatalog();
  class AssetCatalog extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS={id:'assets-grimmes-erwachen-catalog',window:{title:'Assets - Grimmes Erwachen',resizable:true},position:{width:780,height:760}};
    async _renderHTML(){return catalogElement(icons);}
    _replaceHTML(result,content){content.replaceChildren(result);}
  }
  browser=new AssetCatalog();await browser.render({force:true});return browser;
}
export function registerCatalog() {
  class CatalogMenu extends foundry.applications.api.ApplicationV2 {
    render(){showCatalog().catch(error=>ui.notifications.error(error.message));return this;}
  }
  game.settings.registerMenu(ID,'catalog',{name:'Assets - Grimmes Erwachen',label:'Bilderkatalog öffnen',hint:'Kartenelemente und Bodentexturen durchsuchen und als Tile platzieren.',icon:'fas fa-images',type:CatalogMenu,restricted:true});
}
export async function showBrush(){await (await import('./brush.mjs')).showBrush();if(browser?.rendered)await browser.close();}
export async function initializeCatalog() {
  game.modules.get(ID).api={showCatalog,loadCatalog,placeAsset,showBrush};
  if (!game.user.isGM || (game.users.activeGM && game.users.activeGM.id!==game.user.id)) return;
  if (game.macros.find(m=>m.getFlag(ID,'key')==='launcher')) return;
  try {await CONFIG.Macro.documentClass.create({name:'Assets - Grimmes Erwachen',type:'script',img:'icons/svg/chest.svg',command:`await game.modules.get('${ID}').api.showCatalog();`,ownership:{default:0},flags:{[ID]:{key:'launcher'}}});}
  catch(error){ui.notifications.warn('Das Startmakro konnte nicht erstellt werden. Der Bilderkatalog ist in den Moduleinstellungen verfügbar.');}
}
export function sceneControls(controls) {
  controls[ID]={name:ID,title:'Assets – Grimmes Erwachen',icon:'fa-solid fa-images',order:Object.keys(controls).length,visible:game.user.isGM,
    onChange:(_event,enabled)=>{if(enabled)showCatalog().catch(error=>ui.notifications.error(error.message));},
    tools:{catalog:{name:'catalog',title:'Bilderkatalog öffnen',icon:'fa-solid fa-images',order:0,button:true,onChange:()=>showCatalog().catch(error=>ui.notifications.error(error.message))},
      brush:{name:'brush',title:'Boden malen',icon:'fa-solid fa-paintbrush',order:1,button:true,onChange:()=>showBrush().catch(error=>ui.notifications.error(error.message))}}};
}
if (typeof Hooks!=='undefined') {Hooks.once('init',registerCatalog);Hooks.once('ready',initializeCatalog);Hooks.on('getSceneControlButtons',sceneControls);}
