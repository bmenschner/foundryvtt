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
  await page.evaluate(async()=>{
    const {showTileEditor}=await import('/modules/shadowrun-sprawlbuilder/tile-editing.mjs');
    const values={id:'edit',name:'Test-Bordstein',x:300,y:650,width:100,height:20,rotation:0,texture:{anchorX:.5,anchorY:.5,src:'modules/shadowrun-sprawlbuilder/assets/strassen/bordstein-gerade.webp'},levels:['ground'],flags:{'shadowrun-sprawlbuilder':{}}};
    window.editDoc={...values,parent:canvas.scene,toObject(){return Object.fromEntries(Object.entries(this).filter(([k,v])=>k!=='parent'&&typeof v!=='function'));},async update(data){Object.assign(this,data);Hooks.callAll('updateTile',this);}};
    window.editObject={document:editDoc};canvas.tiles={controlled:[editObject]};showTileEditor(editObject);
  });
  const editor=page.getByRole('region',{name:'Asset bearbeiten'});await editor.waitFor();
  assert.equal(await editor.getByRole('button',{name:'Bewegen',exact:true}).count(),0);
  await editor.getByRole('button',{name:'Vergrößern',exact:true}).click();await page.waitForFunction(()=>editDoc.width===101);assert.equal(await page.evaluate(()=>editDoc.height),20.2);
  await editor.getByRole('button',{name:'Seitenverhältnis beibehalten',exact:true}).click();
  await editor.getByLabel('Breite (px)').fill('102');await editor.getByLabel('Breite (px)').press('Tab');await page.waitForFunction(()=>editDoc.width===102);assert.equal(await page.evaluate(()=>editDoc.height),20.2);
  await editor.getByRole('button',{name:'Drehen um 1°',exact:true}).click();await page.waitForFunction(()=>editDoc.rotation===1);
  await editor.getByLabel('Winkel (°)').fill('0');await editor.getByLabel('Winkel (°)').press('Tab');await page.waitForFunction(()=>editDoc.rotation===0);
  const handle=page.getByRole('button',{name:'Frei skalieren',exact:true}),box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+7,box.y+box.height/2+4,{steps:4});
  assert.equal(await page.locator('.ssb-edit-ghost').count(),1);assert.equal(await page.evaluate(()=>editDoc.width),102);await page.mouse.up();await page.waitForFunction(()=>editDoc.width>102);
  assert.equal(await page.locator('.ssb-edit-ghost').count(),0);
  const topLeft=await page.evaluate(()=>({x:editDoc.x-editDoc.width/2,y:editDoc.y-editDoc.height/2}));assert(Math.abs(topLeft.x-249)<1e-6);assert(Math.abs(topLeft.y-639.9)<1e-6);
  await page.evaluate(async()=>{const {showTileEditor}=await import('/modules/shadowrun-sprawlbuilder/tile-editing.mjs');canvas.tiles.controlled=[];showTileEditor(null);});assert.equal(await editor.count(),0);assert.equal(await handle.count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: editor controls, one-pixel field adjustment, ratio unlocking, rotate, free corner image preview, fixed opposite corner and selection cleanup.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
