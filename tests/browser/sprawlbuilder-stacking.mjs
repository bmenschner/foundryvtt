// Run with Playwright available (NODE_PATH may point to its installation).
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=process.cwd();
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]??'application/octet-stream');fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
  await page.goto(`http://127.0.0.1:${server.address().port}/tests/browser/sprawlbuilder.html`);
  const result=await page.evaluate(async()=>{
    const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');
    const {saveStamps}=await import('/modules/shadowrun-sprawlbuilder/stamps.mjs');
    const {saveStroke,renderStroke}=await import('/modules/shadowrun-sprawlbuilder/brush.mjs');
    const {saveAssetStamp,saveRow}=await import('/modules/shadowrun-sprawlbuilder/rows.mjs');
    const icons=await loadCatalog(),floor=icons.find(a=>a.kind==='terrain'),prop=icons.find(a=>a.key==='heckensegment');
    const image=new Image();image.src=`modules/shadowrun-sprawlbuilder/${floor.file}`;await image.decode();
    const scene=canvas.scene,level=canvas.level,rect=canvas.dimensions.sceneRect;
    const cells=[{x:100,y:100,width:100,height:100},{x:200,y:100,width:100,height:100}];
    const ground=await saveStamps({scene,level,asset:floor,cells,ppm:100,image});
    const args={scene,level,rect,point:{x:150,y:150},widthMeters:.5};
    const [curb]=await saveAssetStamp(prop,args),[car]=await saveAssetStamp(prop,args);
    const manual=await saveAssetStamp(prop,{...args,stack:{automatic:false,step:7}});
    const bounds={x:200,y:100,width:100,height:100},surface=renderStroke({bounds,ppm:100,asset:floor,image});
    const rectangle=await saveStroke({scene,level,asset:floor,bounds,surface});
    const row=await saveRow(prop,{scene,level,rect,start:{x:100,y:150},end:{x:300,y:150},widthMeters:.5});
    const answer={ground:ground.map(t=>t.sort),curb:curb.sort,car:car.sort,manual:manual[0].sort,rectangle:rectangle.sort,row:row.map(t=>t.sort),elevations:[...docs.values()].map(t=>t.elevation)};
    docs.clear();return answer;
  });
  assert.deepEqual(result.ground,[0,0]);assert.equal(result.curb,1);assert.equal(result.car,2);assert.equal(result.manual,7);assert.equal(result.rectangle,1);
  assert.deepEqual(result.row,[8,8,2,2]);assert(result.elevations.every(n=>n===0));
  await page.getByLabel('Element suchen').fill('Heckensegment');await page.getByRole('button',{name:'Heckensegment',exact:true}).click();
  const panel=page.locator('.ssb-row-panel');await panel.getByLabel('Kanten einrasten').uncheck();
  await panel.getByLabel('Stempelbreite (m)').fill('1');
  for(let step=0;step<3;step++){
    await page.mouse.move(250,800);await page.waitForFunction(step=>Number(document.querySelector('.ssb-row-panel input[aria-label="Stufe"]').value)===step,step);
    await page.mouse.click(250,800);await page.waitForFunction(count=>docs.size===count,step+1);
  }
  assert.deepEqual(await page.evaluate(()=>[...docs.values()].map(t=>t.sort)),[0,1,2]);
  await panel.getByLabel('Automatisch stapeln').uncheck();await panel.getByLabel('Stufe',{exact:true}).fill('8');
  await page.mouse.click(550,800);await page.waitForFunction(()=>docs.size===4);
  assert.deepEqual(await page.evaluate(()=>[...docs.values()].at(-1).flags['shadowrun-sprawlbuilder'].stack),{automatic:false,step:8});
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: terrain stamps, rectangles, asset stamps and rows save automatic/manual sort with unchanged elevation; cursor preview matches saved steps 0/1/2.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
