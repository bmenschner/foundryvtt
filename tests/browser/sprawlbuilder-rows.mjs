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
  const search=page.getByLabel('Element suchen');await search.fill('Heckensegment');
  await page.getByRole('button',{name:'Heckensegment',exact:true}).click();
  await page.getByRole('button',{name:'Reihe ziehen',exact:true}).click();
  await page.locator('.ssb-row-panel').waitFor();
  assert.equal(await page.locator('.ssb-row-panel').count(),1);
  await page.mouse.move(110,850);await page.mouse.down();await page.mouse.move(740,850,{steps:5});
  assert.match(await page.locator('.ssb-row-panel').innerText(),/3 Segmente · 9 m/);
  assert(await page.locator('.ssb-row-overlay').evaluate(c=>c.getContext('2d').getImageData(200,850,1,1).data[3]>0));
  assert.equal(await page.evaluate(()=>docs.size),0);
  await page.mouse.up();await page.waitForFunction(()=>docs.size===3);
  assert.deepEqual(await page.evaluate(()=>[...docs.values()].map(t=>t.rotation)),[0,0,0]);
  await page.locator('.ssb-row-panel').getByRole('button',{name:'Letzte Reihe zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===0);
  await page.mouse.move(250,950);await page.mouse.down();await page.mouse.move(250,330,{steps:5});await page.mouse.up();await page.waitForFunction(()=>docs.size===3);
  assert.deepEqual(await page.evaluate(()=>[...docs.values()].map(t=>t.rotation)),[270,270,270]);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.ssb-row-panel').count(),0);assert.equal(await page.locator('.ssb-row-overlay').count(),0);
  // A terrain panel and row overlay must not remain active together.
  await page.getByRole('button',{name:'Gelände bauen',exact:true}).click();await page.locator('.ssb-brush').waitFor();assert.equal(await page.locator('.ssb-brush').count(),1);
  await page.evaluate(async()=>{const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');const {showRows}=await import('/modules/shadowrun-sprawlbuilder/rows.mjs');await showRows((await loadCatalog()).find(a=>a.key==='heckensegment'));});
  assert.equal(await page.locator('.ssb-brush').count(),0);assert.equal(await page.locator('.ssb-row-panel').count(),1);
  await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/brush.mjs')).showBrush();});
  assert.equal(await page.locator('.ssb-row-panel').count(),0);assert.equal(await page.locator('.ssb-brush').count(),1);
  await page.evaluate(()=>Hooks.callAll('canvasTearDown'));assert.equal(await page.locator('.ssb-brush').count(),0);
  await page.evaluate(async()=>{const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');const {showRows}=await import('/modules/shadowrun-sprawlbuilder/rows.mjs');const asset=(await loadCatalog()).find(a=>a.key==='heckensegment');await Promise.all([showRows(asset),showRows(asset)]);});
  assert.equal(await page.locator('.ssb-row-panel').count(),1);
  await page.evaluate(()=>Hooks.callAll('canvasTearDown'));assert.equal(await page.locator('.ssb-row-panel').count(),0);assert.equal(await page.locator('.ssb-row-overlay').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: catalog entry, image preview, full row placement, reverse vertical direction, grouped undo, Escape and mutual tool exclusion.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
