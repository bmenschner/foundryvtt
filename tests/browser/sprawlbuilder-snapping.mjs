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
  await page.evaluate(async()=>{await canvas.scene.createEmbeddedDocuments('Tile',[{x:600,y:750,width:400,height:400,rotation:0,texture:{anchorX:.5,anchorY:.5},levels:['ground'],flags:{}}]);});
  await page.getByLabel('Element suchen').fill('Bordstein – gerade');await page.getByRole('button',{name:'Bordstein – gerade',exact:true}).click();
  const panel=page.locator('.ssb-row-panel');await panel.waitFor();await panel.getByLabel('Drehwinkel (°)').fill('90');
  await page.mouse.move(380,750);assert.match(await panel.innerText(),/Kante eingerastet/);
  await page.keyboard.down('Alt');assert.doesNotMatch(await panel.innerText(),/Kante eingerastet/);await page.keyboard.up('Alt');assert.match(await panel.innerText(),/Kante eingerastet/);
  await page.mouse.click(380,750);await page.waitForFunction(()=>docs.size===2);
  const bounds=await page.evaluate(async()=>{const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');const {tileRectangle}=await import('/modules/shadowrun-sprawlbuilder/snapping.mjs');return tileRectangle([...docs.values()].at(-1),new Map((await loadCatalog()).map(a=>[a.key,a])));});
  assert.equal(bounds.rotation,90);assert(Math.abs(bounds.x+bounds.height/2-400)<1e-7);
  await panel.getByRole('button',{name:'Letzte Platzierung zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===1);
  await panel.getByLabel('Kanten einrasten').uncheck();await page.mouse.click(380,750);await page.waitForFunction(()=>docs.size===2);
  const free=await page.evaluate(async()=>{const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');const {tileRectangle}=await import('/modules/shadowrun-sprawlbuilder/snapping.mjs');return tileRectangle([...docs.values()].at(-1),new Map((await loadCatalog()).map(a=>[a.key,a])));});assert(Math.abs(free.x-380)<1e-7);
  await panel.getByRole('button',{name:'Letzte Platzierung zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===1);
  await panel.getByLabel('Kanten einrasten').check();
  await page.evaluate(()=>{const original=window.fetch;window.fetch=async(...args)=>{if(args[1]?.method==='HEAD')docs.get('1').x+=10;return original(...args);};});
  await page.mouse.click(380,750);await page.waitForFunction(()=>window.errors.length===1);assert.equal(await page.evaluate(()=>docs.size),1);
  assert.deepEqual(errors,[]);assert.match((await page.evaluate(()=>window.errors))[0],/abgebrochen/);
  console.log('PASS: curb/pavement snapping, Alt without mouse movement, rotation, exact saved edge, switch, undo and changed-target protection.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
