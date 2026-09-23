// Focused browser check with the existing simulated Foundry fixture.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve('.');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),relative=url.pathname==='/'?'tests/browser/sprawlbuilder.html':decodeURIComponent(url.pathname.slice(1)),target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.statusCode=404;res.end();return;}
  res.setHeader('Content-Type',({'.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(target)]||'application/octet-stream');
  fs.createReadStream(target).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
    const page=await browser.newPage({viewport:{width:1000,height:1100}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByRole('button',{name:'Gelände bauen',exact:true}).click();
    const panel=page.locator('.ssb-brush'),floors=panel.getByRole('group',{name:'Böden'}),filter=panel.getByLabel('Bodenmaterial'),search=panel.getByLabel('Boden suchen');
    await floors.waitFor();assert.equal(await floors.getByRole('button').count(),103);
    await panel.evaluate(el=>{el.style.right='12px';});
    await filter.selectOption('Sandboden');assert.equal(await floors.getByRole('button').count(),10);
    await search.fill('Strandsand');assert.equal(await floors.getByRole('button').count(),1);
    await floors.locator('button:not([hidden]) img').evaluate(image=>image.decode());
    await floors.getByRole('button').click();
    await page.mouse.click(150,850);await page.waitForFunction(()=>created.length===1);
    assert.equal(await page.evaluate(()=>created[0].flags['shadowrun-sprawlbuilder'].key),'boden-sand-01');
    assert.deepEqual(await page.evaluate(()=>[created[0].width,created[0].height]),[100,100]);
    await search.fill('');await filter.selectOption('Industrieboden');assert.equal(await floors.getByRole('button').count(),10);
    await search.fill('Dunkles Riffelblech');await floors.getByRole('button').click();
    await panel.getByLabel('Malmodus').selectOption('rectangle');
    await page.mouse.move(150,850);await page.mouse.down();await page.mouse.move(250,950);await page.mouse.up();
    await page.waitForFunction(()=>created.length===2);
    assert.equal(await page.evaluate(()=>created[1].flags['shadowrun-sprawlbuilder'].key),'boden-industrie-01');
    assert.deepEqual(await page.evaluate(()=>[created[1].width,created[1].height]),[200,200]);
    await search.fill('NichtVorhanden');assert.equal(await floors.getByRole('button').count(),0);
    assert(await panel.getByText('Keine passenden Böden.',{exact:false}).isVisible());
    await page.setViewportSize({width:540,height:900});assert(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth));
    await page.keyboard.press('Escape');assert.equal(await panel.count(),0);
    assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
    console.log('Ground gallery passed: 103 floors, filters, search, image decode, new sand stamp, industrial rectangle, empty state and narrow view.');
  }finally{await browser?.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
