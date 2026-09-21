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
  assert.equal(await page.getByRole('button',{name:'In Szenenmitte platzieren',exact:true}).count(),0);
  await page.getByLabel('Element suchen').fill('Heckensegment');await page.getByRole('button',{name:'Heckensegment',exact:true}).click();
  const panel=page.locator('.ssb-row-panel');await panel.waitFor();assert.equal(await panel.getAttribute('aria-label'),'Asset-Stempel');
  await panel.getByLabel('Stempelbreite (m)').fill('1.5');
  await page.mouse.move(250,800);
  assert(await page.locator('.ssb-row-overlay').evaluate(c=>c.getContext('2d').getImageData(250,800,1,1).data[3]>0));
  await page.mouse.click(250,800);await page.waitForFunction(()=>docs.size===1);
  await page.mouse.click(450,800);await page.waitForFunction(()=>docs.size===2);
  await page.mouse.move(250,650);await page.mouse.down();await page.mouse.move(650,650,{steps:10});assert.equal(await page.evaluate(()=>docs.size),2);await page.mouse.up();await page.waitForFunction(()=>docs.size===3);
  const geometry=await page.evaluate(async()=>{const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');const a=(await loadCatalog()).find(a=>a.key==='heckensegment');const t=[...docs.values()].at(-1),[l,top,r,b]=a.alphaBounds,scale=t.width/a.pixelWidth;return {x:t.x+((l+r)/2-a.pixelWidth/2)*scale,y:t.y+((top+b)/2-a.pixelHeight/2)*scale,width:(r-l)*scale};});
  assert(Math.abs(geometry.x-650)<1e-7);assert(Math.abs(geometry.y-650)<1e-7);assert(Math.abs(geometry.width-150)<1e-7);
  await panel.getByRole('button',{name:'Letzte Platzierung zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===2);
  await panel.getByRole('button',{name:'Reihe ziehen',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.ssb-row-panel')?.getAttribute('aria-label')==='Reihe ziehen');
  await page.keyboard.press('Escape');assert.equal(await panel.count(),0);
  await page.getByRole('button',{name:'Heckensegment',exact:true}).click();await panel.waitFor();await page.mouse.click(250,800,{button:'right'});assert.equal(await panel.count(),0);assert.equal(await page.evaluate(()=>docs.size),2);
  await page.getByRole('button',{name:'Heckensegment',exact:true}).click();await panel.waitFor();await page.evaluate(()=>Hooks.callAll('canvasTearDown'));assert.equal(await panel.count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: immediate asset selection, cursor preview/geometry, size, repeated clicks, one tile after drag, separate undo, row switch, right-click and teardown.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
