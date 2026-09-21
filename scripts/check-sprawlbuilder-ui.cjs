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
    // Use a shifted scene origin and a non-identity camera, then extend a snapped rectangle on all four sides.
    await page.evaluate(()=>{
      canvas.dimensions.sceneRect={x:50,y:70,width:1000,height:1200};
      canvas.canvasCoordinatesFromClient=p=>({x:(p.x-15)/.75,y:(p.y-40)/.75});
      canvas.clientCoordinatesFromCanvas=p=>({x:p.x*.75+15,y:p.y*.75+40});
    });
    await page.getByRole('button',{name:'Gelände bauen',exact:true}).click();
    const mode=page.getByLabel('Malmodus',{exact:true});
    await mode.waitFor({state:'visible'});
    assert.deepEqual(await mode.locator('option').evaluateAll(options=>options.map(o=>o.value)),['stamp','rectangle']);
    assert.equal(await page.getByLabel('Pinselbreite in Metern').count(),0);
    await mode.selectOption('rectangle');await page.getByRole('button',{name:'Malen starten',exact:true}).click();
    const move=async(x,y)=>page.mouse.move(x*.75+15,y*.75+40);
    await move(165,795);await page.mouse.down();await move(425,895);
    const preview=await page.locator('.ssb-brush-overlay').evaluate(el=>{
      const ctx=el.getContext('2d');return {inside:ctx.getImageData(130,620,1,1).data[3],outside:ctx.getImageData(124,614,1,1).data[3]};
    });
    assert(preview.inside>0);assert.equal(preview.outside,0);
    await page.mouse.up();await page.waitForFunction(()=>created.length===5);
    const area=await page.evaluate(()=>created[4]);assert.deepEqual([area.x,area.y,area.width,area.height],[150,770,300,200]);
    assert.equal(area.texture.anchorX,0);assert.equal(area.texture.anchorY,0);
    await mode.selectOption('stamp');
    for(const [x,y] of [[149,800],[451,800],[200,769],[200,971]]){
      const before=await page.evaluate(()=>created.length);await move(x,y);await page.mouse.down();await page.mouse.up();
      await page.waitForFunction(n=>created.length===n+1,before);
    }
    const borders=await page.evaluate(()=>created.slice(5).map(t=>[t.x,t.y,t.width,t.height]));
    assert.deepEqual(borders,[[50,770,100,100],[450,770,100,100],[150,670,100,100],[150,970,100,100]]);
    // Compare saved pixels against one continuous reference surface: material phase must not restart at tile edges.
    assert(await page.evaluate(async()=>{
      const {renderStroke}=await import('/modules/shadowrun-sprawlbuilder/brush.mjs');
      const {loadCatalog,assetPath}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');
      const asset=(await loadCatalog()).find(a=>a.key==='asphalt-einfach'),image=new Image();image.src=assetPath(asset);await image.decode();
      const reference=renderStroke({bounds:{x:50,y:670,width:500,height:400},ppm:100,asset,image}).getContext('2d');
      for(const t of created.slice(4)){
        const img=new Image();img.src=t.texture.src;await img.decode();const surface=document.createElement('canvas');surface.width=t.width;surface.height=t.height;
        const ctx=surface.getContext('2d');ctx.drawImage(img,0,0);const actual=ctx.getImageData(0,0,t.width,t.height).data;
        const expected=reference.getImageData(t.x-50,t.y-670,t.width,t.height).data;
        // Separate GPU-backed canvases can round interpolated pixels differently.
        const meanDelta=actual.reduce((sum,value,i)=>sum+Math.abs(value-expected[i]),0)/actual.length;
        if(meanDelta>1)throw new Error(`Texture phase mismatch at ${t.x},${t.y}: mean channel difference ${meanDelta}`);
      }
      return true;
    }));
    await page.getByRole('button',{name:'Letzten Strich zurücknehmen'}).click();await page.waitForFunction(()=>remaining?.length===5);
    await page.getByRole('button',{name:'Schließen',exact:true}).click();
    await page.getByRole('button',{name:'Filter zurücksetzen'}).click();await category.selectOption('strassen');
    await page.locator('.ssb-card img').evaluateAll(async images=>{await Promise.all(images.map(im=>im.decode()));});
    if(process.env.UI_SCREENSHOT)await page.screenshot({path:process.env.UI_SCREENSHOT,fullPage:true});
    await page.setViewportSize({width:540,height:1000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
    console.log('SprawlBuilder browser check passed: catalog, placement, stamp drag, snapped rectangle preview, four adjacent edges, identical texture phase, undo and narrow layout.');
  }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
