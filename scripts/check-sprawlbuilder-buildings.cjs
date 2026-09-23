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
    const page=await browser.newPage({viewport:{width:1300,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForSelector('.ssb-catalog');
    const geometry=await page.evaluate(async()=>{const m=await import('/modules/shadowrun-sprawlbuilder/buildings.mjs');return {rectangle:m.roofOutline(8,6),l:m.roofOutline(8,6,'l'),north:m.balconyBounds(m.roofOutline(8,6),'north'),south:m.balconyBounds(m.roofOutline(8,6),'south')};});
    assert.equal(geometry.rectangle.length,4);assert.equal(geometry.l.length,6);assert.equal(geometry.north.y,-1);assert.equal(geometry.south.y,6);
    await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/buildings.mjs')).showBuildings();});
    const panel=page.locator('.ssb-building-panel');await panel.waitFor();
    await page.mouse.click(50,950,{button:'right'});
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.ssb-building-overlay')).pointerEvents),'none');
    assert.notEqual(await page.evaluate(()=>document.elementFromPoint(50,950)?.className),'ssb-building-overlay');
    await panel.getByRole('button',{name:'Fortsetzen'}).click();
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.ssb-building-overlay')).pointerEvents),'auto');
    await panel.getByLabel('Gebäudeform').selectOption('l');await panel.getByLabel('Balkonseite').selectOption('south');
    await page.mouse.move(100,200);await page.mouse.down();await page.mouse.move(600,800,{steps:5});await page.mouse.up();
    await page.waitForFunction(()=>created.length===1);
    const first=await page.evaluate(()=>({tile:created[0],upload:uploads[0],errors:window.errors}));
    assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].building,true);assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].shape,'l');assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].balcony,'south');
    assert.deepEqual(first.tile.flags['shadowrun-sprawlbuilder'].footprint,{x:100,y:200,width:600,height:700});
    assert.equal(first.tile.levels[0],'ground');assert.equal(first.tile.elevation,0);assert.match(first.upload.folder,/shadowrun-sprawlbuilder-buildings$/);
    assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].footprintUV.length,4);
    const pixels=await page.evaluate(async()=>{const img=new Image();img.src=created[0].texture.src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const alpha=(x,y)=>ctx.getImageData(x,y,1,1).data[3];return {roof:alpha(240,440),missingCorner:alpha(640,240),balcony:alpha(440,890)};});
    assert(pixels.roof>200,'Dachfläche sichtbar');assert.equal(pixels.missingCorner,0,'L-Aussparung transparent');assert(pixels.balcony>200,'Balkon sichtbar');
    const doorway=await page.evaluate(async()=>{const img=new Image();img.src=created[0].texture.src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return {opening:[...ctx.getImageData(440,840,1,1).data],wall:[...ctx.getImageData(240,840,1,1).data]};});
    assert.notDeepEqual(doorway.opening,doorway.wall,'Balkonzugang unterbricht die Attika');
    await panel.getByRole('button',{name:'Letztes Gebäude zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===0);
    await panel.getByLabel('Gebäudeform').selectOption('rectangle');await panel.getByLabel('Balkonseite').selectOption('none');
    await panel.getByLabel('Fassadenansicht').selectOption('north');
    await page.mouse.move(120,100);await page.mouse.down();await page.mouse.move(700,500,{steps:4});await page.mouse.up();await page.waitForFunction(()=>created.length===2);
    assert.equal(await page.evaluate(()=>created[1].flags['shadowrun-sprawlbuilder'].facing),'north');
    await page.evaluate(()=>Hooks.callAll('canvasTearDown'));assert.equal(await panel.count(),0);
    assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
    console.log('Building prototype passed: grid geometry, L roof with balcony, scene tile persistence, own undo, rectangle and scene cleanup.');
  }finally{await browser?.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
