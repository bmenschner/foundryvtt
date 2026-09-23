import {registerTileEditing} from './tile-editing.mjs';
import {setStackCatalog,stackedTile} from './stacking.mjs';
import {showRows,showAssetStamp,closeRows} from './rows.mjs';
import {closeBrush} from './brush.mjs';
import {collections,taxonomy,assetTypes} from './taxonomy.mjs';
import {rememberApplication} from './panels.mjs';
import {showBuildings,closeBuildings} from './buildings.mjs';
export {collections,taxonomy,assetTypes};
export const ID='shadowrun-sprawlbuilder';
const BASE=`modules/${ID}`;
export const categories=Object.fromEntries(Object.entries(taxonomy).map(([key,value])=>[key,value.label]));
let browser;

export const normalize=value=>String(value??'').toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ß','ss');
export function filterAssets(icons,query='',category='',{collection='',subcategory='',assetType=''}={}) {
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  return icons.filter(a=>(!category || a.category===category) && (!collection || a.collection===collection) && (!subcategory || a.subcategory===subcategory) && (!assetType || a.assetType===assetType) && words.every(w=>normalize([a.name,a.key,categories[a.category],taxonomy[a.category]?.subcategories[a.subcategory],collections[a.collection],assetTypes[a.assetType],...(a.tags??[])].join(' ')).includes(w)))
    .sort((a,b)=>a.name.localeCompare(b.name,'de'));
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
  return {name:asset.name,texture:{src:assetPath(asset),anchorX:0,anchorY:0},width:asset.pixelWidth*scale,height:asset.pixelHeight*scale,
    x:rect.x+rect.width/2-(left+right)/2*scale,y:rect.y+rect.height/2-(top+bottom)/2*scale,
    rotation:0,hidden:false,locked:false,elevation:Number.isFinite(level?.elevation?.bottom)?level.elevation.bottom:0,
    levels:level?.id?[level.id]:[],flags:{[ID]:{key:asset.key,widthMeters}}};
}
export async function loadCatalog() {
  const response=await fetch(`${BASE}/catalog.json`,{cache:'no-store'});
  if (!response.ok) throw new Error('Der Bilderkatalog fehlt. Bitte das vollständige Asset-Modul installieren.');
  const catalog=await response.json();
  if (!Array.isArray(catalog.icons)) throw new Error('Ungültiger Bilderkatalog.');
  const keys=new Set();
  for(const asset of catalog.icons) {
    assetPath(asset);
    if(keys.has(asset.key) || !collections[asset.collection] || !taxonomy[asset.category]?.subcategories[asset.subcategory] || !assetTypes[asset.assetType]) throw new Error('Ungültige Zuordnung im Bilderkatalog.');
    keys.add(asset.key);
  }
  setStackCatalog(catalog.icons);return catalog.icons;
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
  const [created]=await scene.createEmbeddedDocuments('Tile',[stackedTile(data,scene.tiles,level.id)]);
  if (!created) throw new Error('Das Element konnte nicht angelegt werden.');
  canvas.tiles?.activate();
  created.object?.control({releaseOthers:true});
  ui.notifications.info(`${asset.name} wurde in der Szenenmitte platziert.`);
  return created;
}

export function catalogElement(icons) {
  const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
  const root=node('section',undefined,'ssb-catalog');
  const intro=node('p',`${icons.length} Kartenelemente für deine Schattenwelt. Sammlung und Verwendung wählen, dann ein Element platzieren.`);
  const tools=node('div',undefined,'ssb-tools');
  const search=node('input');search.type='search';search.placeholder='Element suchen …';search.setAttribute('aria-label','Element suchen');
  const filters=node('div',undefined,'ssb-filters');
  const select=(label)=>{const wrapper=node('label',label),el=node('select');el.setAttribute('aria-label',label);wrapper.append(el);filters.append(wrapper);return el;};
  const collection=select('Sammlung'),category=select('Kategorie'),subcategory=select('Unterkategorie'),type=select('Elementtyp');
  const options=(el,labels,items,field,all)=>{const before=el.value;el.replaceChildren(new Option(all,''));for(const [key,label] of Object.entries(labels)){const count=items.filter(a=>a[field]===key).length;if(count)el.append(new Option(`${label} (${count})`,key));}el.value=[...el.options].some(o=>o.value===before)?before:'';};
  options(collection,collections,icons,'collection','Alle Sammlungen');
  function updateFilters(){
    const inCollection=icons.filter(a=>!collection.value||a.collection===collection.value);
    options(category,categories,inCollection,'category','Alle Kategorien');
    const inCategory=inCollection.filter(a=>!category.value||a.category===category.value);
    const subs=category.value?taxonomy[category.value].subcategories:{};
    options(subcategory,subs,inCategory,'subcategory','Alle Unterkategorien');subcategory.disabled=!category.value;
    options(type,assetTypes,inCategory.filter(a=>!subcategory.value||a.subcategory===subcategory.value),'assetType','Alle Elementtypen');
  }
  updateFilters();
  const reset=node('button','Filter zurücksetzen');reset.type='button';
  const resetPosition=node('button','Fensterposition zurücksetzen');resetPosition.type='button';resetPosition.addEventListener('click',()=>browser?.panelPosition?.reset());
  tools.append(search,reset,resetPosition);
  const status=node('p');status.setAttribute('aria-live','polite');
  const cards=node('div',undefined,'ssb-cards');
  const paging=node('div',undefined,'ssb-tools');
  const previous=node('button','Zurück'),next=node('button','Weiter');previous.type=next.type='button';paging.append(previous,next);
  const detail=node('div',undefined,'ssb-detail');
  const selectedName=node('strong','Noch kein Element ausgewählt.'),selectedMeta=node('small');
  const sizeLabel=node('label','Sichtbare Breite (m) '),width=node('input');width.type='number';width.min='0.01';width.max='1000';width.step='0.01';width.disabled=true;sizeLabel.append(width);
  const row=node('button','Reihe ziehen');row.type='button';row.disabled=true;
  const pathLabel=node('label','Bildpfad '),path=node('input');path.readOnly=true;pathLabel.append(path);path.addEventListener('click',()=>path.select());
  detail.append(selectedName,selectedMeta,sizeLabel,row,pathLabel,node('small','Die Breite bezieht sich auf das sichtbare Objekt. Maße sind Vorschläge. Bauteile sind Bilder; Sicht- und Bewegungswände setzt du mit Foundrys Wandwerkzeug.'));
  root.append(intro,filters,tools,status,cards,paging,detail);
  let page=0,selected=null,placing=false;
  function draw() {
    const matches=filterAssets(icons,search.value,category.value,{collection:collection.value,subcategory:subcategory.value,assetType:type.value}),pages=Math.max(1,Math.ceil(matches.length/24));page=Math.min(page,pages-1);
    if(selected&&!matches.some(a=>a.key===selected.key)){selected=null;selectedName.textContent='Noch kein Element ausgewählt.';selectedMeta.textContent='';width.value='';width.disabled=true;path.value='';row.disabled=true;}
    status.textContent=`${matches.length} Treffer · Seite ${page+1} von ${pages}`;
    previous.disabled=page===0;next.disabled=page>=pages-1;cards.replaceChildren();
    for(const asset of matches.slice(page*24,(page+1)*24)) {
      const card=node('button',undefined,'ssb-card');card.type='button';card.setAttribute('aria-label',asset.name);card.setAttribute('aria-pressed',String(selected?.key===asset.key));
      const picture=node('img');picture.src=assetPath(asset);picture.alt='';picture.loading='lazy';picture.width=120;picture.height=100;
      card.append(picture,node('span',asset.name),node('small',taxonomy[asset.category].subcategories[asset.subcategory]));
      card.addEventListener('click',async()=>{if(placing)return;selected=asset;selectedName.textContent=asset.name;selectedMeta.textContent=`${collections[asset.collection]} · ${categories[asset.category]} · ${taxonomy[asset.category].subcategories[asset.subcategory]} · ${assetTypes[asset.assetType]}`;width.disabled=false;width.value=String(asset.widthMeters);path.value=assetPath(asset);row.disabled=false;draw();placing=true;try{await showAssetStamp(asset,Number(width.value));}catch(error){ui.notifications.error(error.message);}finally{placing=false;}});
      cards.append(card);
    }
    if(!matches.length)cards.append(node('p','Keine passenden Elemente vorhanden. Suche oder Filter ändern.','ssb-empty'));
  }
  search.addEventListener('input',()=>{page=0;draw();});
  for(const el of [collection,category,subcategory,type])el.addEventListener('change',()=>{page=0;updateFilters();draw();});
  reset.addEventListener('click',()=>{search.value=collection.value=category.value=subcategory.value=type.value='';page=0;updateFilters();draw();});
  previous.addEventListener('click',()=>{pssb--;draw();});next.addEventListener('click',()=>{page++;draw();});
  row.addEventListener('click',async()=>{if(!selected||placing)return;placing=true;row.disabled=true;try{await showRows(selected,Number(width.value));}catch(error){ui.notifications.error(error.message);}finally{placing=false;row.disabled=!selected;}});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeCatalog().catch(error=>ui.notifications.error(error.message));}},{capture:true});
  root.addEventListener('contextmenu',e=>{e.preventDefault();e.stopImmediatePropagation();closeRows();selected=null;selectedName.textContent='Noch kein Element ausgewählt.';selectedMeta.textContent='';width.disabled=true;row.disabled=true;path.value='';draw();});
  draw();return root;
}
export async function closeCatalog(){if(browser?.rendered)await browser.close();}
export async function showCatalog() {
  if (!game.user.isGM) return;
  if (browser?.rendered) {browser.bringToFront();return browser;}
  const icons=await loadCatalog();
  class AssetCatalog extends foundry.applications.api.ApplicationV2 {
    static DEFAULT_OPTIONS={id:'shadowrun-sprawlbuilder-catalog',window:{title:'Shadowrun SprawlBuilder · Assets',resizable:true},position:{width:780,height:760}};
    async close(options){this.panelPosition?.dispose();closeRows();closeBrush();closeBuildings();return super.close(options);}
    async _renderHTML(){return catalogElement(icons);}
    _replaceHTML(result,content){content.replaceChildren(result);}
  }
  browser=new AssetCatalog();await browser.render({force:true});browser.panelPosition=rememberApplication(browser);return browser;
}
export function registerCatalog() {
  class CatalogMenu extends foundry.applications.api.ApplicationV2 {
    render(){showCatalog().catch(error=>ui.notifications.error(error.message));return this;}
  }
  game.settings.registerMenu(ID,'catalog',{name:'Shadowrun SprawlBuilder',label:'Bilderkatalog öffnen',hint:'Kartenelemente und Bodentexturen durchsuchen und als Tile platzieren.',icon:'fas fa-images',type:CatalogMenu,restricted:true});
}
export async function showBrush(assetKey){await (await import('./brush.mjs')).showBrush(assetKey);}
export async function initializeCatalog() {
  game.modules.get(ID).api={showCatalog,loadCatalog,placeAsset,showBrush,showRows,showAssetStamp,showBuildings};
  if (!game.user.isGM || (game.users.activeGM && game.users.activeGM.id!==game.user.id)) return;
  if (game.macros.find(m=>m.getFlag(ID,'key')==='launcher')) return;
  try {await CONFIG.Macro.documentClass.create({name:'Shadowrun SprawlBuilder',type:'script',img:'icons/svg/chest.svg',command:`await game.modules.get('${ID}').api.showCatalog();`,ownership:{default:0},flags:{[ID]:{key:'launcher'}}});}
  catch(error){ui.notifications.warn('Das Startmakro konnte nicht erstellt werden. Der Bilderkatalog ist in den Moduleinstellungen verfügbar.');}
}
export function sceneControls(controls) {
  controls[ID]={name:ID,title:'Shadowrun SprawlBuilder',icon:'fa-solid fa-images',order:Object.keys(controls).length,visible:game.user.isGM,
    tools:{brush:{name:'brush',title:'Gelände bauen',icon:'fa-solid fa-border-all',order:0,button:true,onChange:()=>showBrush().catch(error=>ui.notifications.error(error.message))},
      buildings:{name:'buildings',title:'Gebäude bauen',icon:'fa-solid fa-building',order:1,button:true,onChange:()=>showBuildings().catch(error=>ui.notifications.error(error.message))},
      catalog:{name:'catalog',title:'Assets',icon:'fa-solid fa-images',order:2,button:true,onChange:()=>showCatalog().catch(error=>ui.notifications.error(error.message))}}};
}
if (typeof Hooks!=='undefined') {Hooks.once('init',registerTileEditing);Hooks.once('init',registerCatalog);Hooks.once('ready',initializeCatalog);Hooks.on('getSceneControlButtons',sceneControls);}
