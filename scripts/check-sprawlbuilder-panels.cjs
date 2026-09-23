const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve('.');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),relative=url.pathname==='/'?'tests/browser/sprawlbuilder.html':decodeURIComponent(url.pathname.slice(1)),target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1200,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const openTerrain=()=>page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/brush.mjs')).showBrush();});
    const drag=async(panel,dx,dy)=>{const header=panel.locator('.ssb-panel-header'),r=await header.boundingBox();await page.mouse.move(r.x+20,r.y+12);await page.mouse.down();await page.mouse.move(r.x+20+dx,r.y+12+dy,{steps:5});await page.mouse.up();};
    const position=panel=>panel.evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top};});
    await openTerrain();const terrain=page.locator('.ssb-brush');await terrain.waitFor();
    await terrain.getByLabel('Boden suchen').fill('Strandsand');await terrain.getByRole('group',{name:'Böden'}).getByRole('button').click();
    const initial=await position(terrain);await drag(terrain,-180,10);const moved=await position(terrain);assert.equal(moved.left,initial.left-180);
    assert.equal(await page.evaluate(()=>created.length),0);
    await page.mouse.click(100,1050);await page.waitForFunction(()=>created.length===1);
    await page.keyboard.press('Escape');await openTerrain();assert.deepEqual(await position(terrain),moved);
    await page.keyboard.press('Escape');await page.reload();await page.waitForSelector('.ssb-catalog');await openTerrain();assert.deepEqual(await position(terrain),moved);
    await terrain.getByRole('button',{name:'Position zurücksetzen',exact:true}).click();assert.deepEqual(await position(terrain),initial);
    const openAsset=key=>page.evaluate(async key=>{const {loadCatalog}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');await (await import('/modules/shadowrun-sprawlbuilder/rows.mjs')).showAssetStamp((await loadCatalog()).find(a=>a.key===key));},key);
    await openAsset('cafe-stuhl-holz');const asset=page.locator('.ssb-row-panel');await asset.waitFor();
    await drag(asset,-240,20);const assetPosition=await position(asset);assert.equal(await page.evaluate(()=>created.length),0);
    await openAsset('cafe-tisch-rund');assert.deepEqual(await position(asset),assetPosition);
    await asset.getByRole('button',{name:'Reihe ziehen',exact:true}).click();await asset.getByRole('button',{name:'Letzte Reihe zurücknehmen'}).waitFor();assert.deepEqual(await position(asset),assetPosition);
    const h=await asset.locator('.ssb-panel-header').boundingBox();await page.mouse.move(h.x+20,h.y+12);await page.mouse.down();await page.mouse.move(h.x+80,h.y+42);
    await asset.locator('.ssb-panel-header').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();assert.deepEqual(await position(asset),assetPosition);
    await page.setViewportSize({width:540,height:700});const small=await asset.boundingBox();assert(small.x>=0&&small.x+small.width<=540&&small.y>=0);
    await page.evaluate(()=>Hooks.callAll('canvasTearDown'));assert.equal(await asset.count(),0);await page.mouse.move(50,50);await page.mouse.up();
    assert.equal(await page.evaluate(()=>created.length),0);assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
    console.log('Movable panels passed: active-tool drag without placement, subsequent stamping, reload persistence, reset, asset/row switch, cancellation, viewport clamp and cleanup.');
  }finally{await browser?.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
