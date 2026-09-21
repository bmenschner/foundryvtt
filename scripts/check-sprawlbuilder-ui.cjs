// Optional browser check: install Playwright or point PLAYWRIGHT_MODULE at its package.
// CHROME_PATH may select an installed browser; UI_SCREENSHOT is an optional output path.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve('.');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),relative=url.pathname==='/'?'tests/browser/sprawlbuilder.html':decodeURIComponent(url.pathname.slice(1)),target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(target)]||'application/octet-stream');
  if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
    const page=await browser.newPage({viewport:{width:900,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForSelector('.ssb-card');
    const category=page.getByLabel('Kategorie',{exact:true}),sub=page.getByLabel('Unterkategorie',{exact:true}),type=page.getByLabel('Elementtyp',{exact:true});
    assert.equal(await page.locator('.ssb-card').count(),24);assert(await sub.isDisabled());
    await page.getByRole('button',{name:'Weiter',exact:true}).click();assert.match(await page.locator('[aria-live]').innerText(),/Seite 2/);
    await page.getByLabel('Sammlung',{exact:true}).selectOption('grimmes-erwachen');
    await category.selectOption('ausstattung');await sub.selectOption('labor');
    assert.equal(await page.locator('.ssb-card').count(),2);
    await page.getByRole('button',{name:'Laborarbeitsplatte',exact:true}).click();
    await page.getByRole('spinbutton').fill('1.5');await page.getByRole('button',{name:'In Szenenmitte platzieren'}).click();
    await page.waitForFunction(()=>created.length===1);
    const tile=await page.evaluate(()=>created[0]);assert.equal(tile.flags['shadowrun-sprawlbuilder'].widthMeters,1.5);assert.match(tile.texture.src,/modules\/shadowrun-sprawlbuilder\//);
    await category.selectOption('strassen');assert.equal(await sub.inputValue(),'');assert(await page.getByRole('button',{name:'In Szenenmitte platzieren'}).isDisabled());
    await sub.selectOption('kanalisation');await page.getByRole('searchbox').fill('gully');
    assert(await page.getByRole('button',{name:'Kanaldeckel',exact:true}).isVisible());
    await page.getByRole('searchbox').fill('Kein solches Asset');assert.equal(await page.locator('.ssb-card').count(),0);assert(await page.locator('.ssb-empty').isVisible());
    await page.getByRole('button',{name:'Filter zurücksetzen'}).click();assert.equal(await page.locator('.ssb-card').count(),24);assert.equal(await category.inputValue(),'');
    await type.selectOption('terrain');assert.equal(await page.locator('.ssb-card').count(),3);
    await page.getByRole('button',{name:'Straße – einfacher Asphalt',exact:true}).click();await page.getByRole('button',{name:'Gelände bauen',exact:true}).click();
    assert.equal(await page.getByLabel('Material',{exact:true}).inputValue(),'asphalt-einfach');
    await page.getByRole('button',{name:'Malen starten',exact:true}).click();
    await page.mouse.move(120,850);await page.mouse.down();await page.mouse.move(350,850,{steps:5});await page.mouse.up();
    await page.waitForFunction(()=>created.length===4);
    const stamps=await page.evaluate(()=>created.slice(1));assert.deepEqual(stamps.map(t=>[t.x,t.y,t.width,t.height]),[[100,800,100,100],[200,800,100,100],[300,800,100,100]]);
    assert((await page.evaluate(()=>uploads)).every(u=>u.folder==='worlds/sprawlbuilder-test/shadowrun-sprawlbuilder-painted'));
    await page.getByRole('button',{name:'Letzten Strich zurücknehmen'}).click();await page.waitForFunction(()=>remaining?.length===1);
    await page.getByRole('button',{name:'Schließen',exact:true}).click();
    await page.getByRole('button',{name:'Filter zurücksetzen'}).click();await category.selectOption('strassen');
    await page.locator('.ssb-card img').evaluateAll(async images=>{await Promise.all(images.map(im=>im.decode()));});
    if(process.env.UI_SCREENSHOT)await page.screenshot({path:process.env.UI_SCREENSHOT,fullPage:true});
    await page.setViewportSize({width:540,height:1000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
    console.log('SprawlBuilder browser check passed: filters, empty state, paging, placement, terrain selection, 1-m drag, undo, images and narrow layout.');
  }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
