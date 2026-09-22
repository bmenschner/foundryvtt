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
  await page.locator('.ssb-catalog').waitFor();
  // Application shell emulates only lifetime/z-order; real module controls and events run in Chrome.
  await page.evaluate(async()=>{
    document.querySelector('.ssb-catalog').remove();
    foundry.applications.api={ApplicationV2:class {
      async render(){this.element=document.createElement('section');this.element.style.cssText='position:fixed;left:20px;top:110px;width:780px;height:650px;overflow:auto;z-index:100';this._replaceHTML(await this._renderHTML(),this.element);document.body.append(this.element);this.rendered=true;this.escape=e=>{if(e.key==='Escape')this.close();};document.addEventListener('keydown',this.escape);return this;}
      async close(){this.element.remove();this.rendered=false;document.removeEventListener('keydown',this.escape);return this;}
      bringToFront(){}
    }};
    await (await import('/modules/shadowrun-sprawlbuilder/catalog.mjs')).showCatalog();
  });
  const search=page.getByLabel('Element suchen');await search.fill('Heckensegment');
  await page.getByRole('button',{name:'Heckensegment',exact:true}).click();
  const panel=page.locator('.ssb-row-panel');await panel.waitFor();
  assert.equal(await page.locator('.ssb-catalog').count(),1);
  const step=panel.getByLabel('Stufe',{exact:true}),auto=panel.getByLabel('Automatisch stapeln');
  assert(await panel.getByRole('button',{name:'Stufe verringern',exact:true}).isDisabled());
  await panel.getByRole('button',{name:'Stufe erhöhen',exact:true}).click();assert.equal(await step.inputValue(),'1');assert.equal(await auto.isChecked(),false);
  await panel.getByRole('button',{name:'Stufe verringern',exact:true}).click();assert.equal(await step.inputValue(),'0');assert(await panel.getByRole('button',{name:'Stufe verringern',exact:true}).isDisabled());
  await auto.check();assert(await step.isDisabled());
  await page.mouse.click(250,850,{button:'right'});assert.equal(await panel.count(),0);assert.equal(await search.inputValue(),'Heckensegment');
  await page.getByRole('button',{name:'Heckensegment',exact:true}).click();await panel.waitFor();
  await panel.getByRole('button',{name:'Reihe ziehen',exact:true}).click();await panel.waitFor();
  await page.mouse.move(150,850);await page.mouse.down();await page.mouse.move(700,850);
  await page.mouse.click(700,850,{button:'right'});await page.mouse.up();assert.equal(await page.evaluate(()=>docs.size),0);assert.equal(await panel.count(),0);
  await search.fill('Gullideckel');await page.locator('.ssb-card').first().click();await panel.waitFor();
  await panel.getByLabel('Stempelbreite (m)').focus();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('.ssb-catalog'));assert.equal(await panel.count(),0);assert.equal(await page.locator('.ssb-row-overlay').count(),0);
  await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/catalog.mjs')).showCatalog();});
  await page.getByRole('button',{name:'Gelände bauen',exact:true}).click();const floor=page.locator('.ssb-brush');await floor.waitFor();
  await floor.locator('.ssb-floor-card').first().click();
  await floor.getByRole('button',{name:'Stufe erhöhen',exact:true}).click();assert.equal(await floor.getByLabel('Stufe',{exact:true}).inputValue(),'1');assert.equal(await floor.getByLabel('Automatisch stapeln').isChecked(),false);
  await page.mouse.move(250,850);await page.mouse.down();await page.mouse.move(350,850);await page.mouse.click(350,850,{button:'right'});await page.mouse.up();
  assert.equal(await page.evaluate(()=>docs.size),0);assert.equal(await floor.count(),1);assert.equal(await floor.locator('.ssb-floor-card[aria-pressed=true]').count(),0);
  assert.equal(await page.locator('.ssb-brush-overlay').evaluate(el=>el.style.pointerEvents),'none');
  await floor.locator('.ssb-floor-card').nth(1).click();await page.mouse.click(250,850);await page.waitForFunction(()=>docs.size===1);
  assert.equal(await page.evaluate(()=>[...docs.values()][0].flags['shadowrun-sprawlbuilder'].stack.step),1);
  await floor.getByLabel('Stufe',{exact:true}).focus();await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('.ssb-catalog'));assert.equal(await floor.count(),0);assert.equal(await page.locator('.ssb-brush-overlay').count(),0);
  // Repeat opening and close via the application's close method, not only keyboard.
  await page.evaluate(async()=>{const api=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');await api.showCatalog();});
  await search.fill('Heckensegment');await page.getByRole('button',{name:'Heckensegment',exact:true}).click();await panel.waitFor();
  await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/catalog.mjs')).closeCatalog();});
  assert.equal(await panel.count(),0);assert.equal(await page.locator('.ssb-row-overlay').count(),0);
  await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/catalog.mjs')).showCatalog();});
  await search.focus();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.ssb-catalog'));
  const disabled=await page.evaluate(async()=>{const {stackControls}=await import('/modules/shadowrun-sprawlbuilder/stacking.mjs');let changed=0;const c=stackControls({automatic:true,step:2},()=>changed++);c.disable(true);for(const b of c.node.querySelectorAll('button'))b.click();return {changed,disabled:[...c.node.querySelectorAll('button')].every(b=>b.disabled),value:c.read()};});
  assert.deepEqual(disabled,{changed:0,disabled:true,value:{automatic:true,step:2}});
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: +/- steps, automatic/manual switch, persistent gallery, right-click cancels asset/row/floor strokes, Escape from inputs closes all, reopen and application cleanup.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
