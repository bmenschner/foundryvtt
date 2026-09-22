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
  await page.getByRole('button',{name:'Gelände bauen',exact:true}).click();
  const panel=page.locator('.ssb-brush'),material=panel.locator('.ssb-floor-card').first();
  assert.equal(await page.getByRole('button',{name:'Malen starten',exact:true}).count(),0);
  await material.click();assert.equal(await page.locator('.ssb-brush-overlay').evaluate(e=>e.style.pointerEvents),'auto');
  await panel.getByLabel('Malmodus').selectOption('rectangle');
  async function drag(x,y,z,w){await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(z,w,{steps:4});await page.mouse.up();await page.waitForFunction(()=>!document.querySelector('.ssb-brush .ssb-floor-card[disabled]'));}
  await drag(110,710,390,890);
  assert.equal(await page.evaluate(()=>docs.size),1);
  const before=await page.evaluate(()=>[...docs.values()][0].texture.src);
  await panel.getByRole('button',{name:'Boden löschen',exact:true}).click();
  await panel.getByLabel('Malmodus').selectOption('stamp');await drag(210,710,210,710);
  const alpha=await page.evaluate(async()=>{
    const tile=[...docs.values()][0],img=new Image();img.src=tile.texture.src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    return [ctx.getImageData(150,50,1,1).data[3],ctx.getImageData(50,50,1,1).data[3],ctx.getImageData(150,150,1,1).data[3]];
  });assert.deepEqual(alpha,[0,255,255]);
  await panel.getByRole('button',{name:'Letzte Aktion zurücknehmen'}).click();await page.waitForFunction(src=>[...docs.values()][0].texture.src===src,before);
  await panel.getByLabel('Malmodus').selectOption('rectangle');await drag(390,890,110,710);assert.equal(await page.evaluate(()=>docs.size),0);
  await panel.getByRole('button',{name:'Letzte Aktion zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===1);
  assert.equal(await page.evaluate(()=>[...docs.values()][0].texture.src),before);
  await page.mouse.click(250,850,{button:'right'});assert.equal(await page.locator('.ssb-brush-overlay').evaluate(e=>e.style.pointerEvents),'none');
  await material.click();assert.equal(await page.locator('.ssb-brush-overlay').evaluate(e=>e.style.pointerEvents),'auto');
  // Upload failure and concurrent changes must not destroy the floor; undo must refuse to overwrite edits.
  const checks=await page.evaluate(async()=>{
    const {eraseTerrain}=await import('/modules/shadowrun-sprawlbuilder/erase.mjs'),{undoStroke}=await import('/modules/shadowrun-sprawlbuilder/brush.mjs');
    const tile=[...docs.values()][0],src=tile.texture.src,picker=foundry.applications.apps.FilePicker.implementation,upload=picker.upload,args={scene:canvas.scene,level:canvas.level,areas:[{x:200,y:700,width:100,height:100}]};
    picker.upload=async()=>({error:'test upload failure'});let failed=false;try{await eraseTerrain(args);}catch{failed=true;}picker.upload=upload;
    const preserved=tile.texture.src===src;await eraseTerrain(args);tile.x+=1;let blocked=false;try{await undoStroke();}catch{blocked=true;}tile.x-=1;
    await eraseTerrain({...args,areas:[{x:100,y:700,width:100,height:100}]});await undoStroke();await undoStroke();
    return {failed,preserved,blocked,restored:tile.texture.src===src};
  });assert.deepEqual(checks,{failed:true,preserved:true,blocked:true,restored:true});
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: direct selection, partial stamp alpha, rectangle deletion, undo, pause/reactivation, failed uploads and concurrent-change protection.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
