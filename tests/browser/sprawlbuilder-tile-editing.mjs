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
  await editor.getByRole('button',{name:'Rechts drehen um 1°',exact:true}).click();await page.waitForFunction(()=>editDoc.rotation===1);
  await editor.getByLabel('Winkel (°)').fill('0');await editor.getByLabel('Winkel (°)').press('Tab');await page.waitForFunction(()=>editDoc.rotation===0);
  await editor.getByRole('button',{name:'Links drehen um 1°',exact:true}).click();await page.waitForFunction(()=>editDoc.rotation===359);
  await editor.getByRole('button',{name:'Rechts drehen um 1°',exact:true}).click();await page.waitForFunction(()=>editDoc.rotation===0);
  assert.equal(await page.getByRole('button',{name:'Frei skalieren',exact:true}).count(),0);
  assert.equal(await page.locator('.ssb-edit-corner,.ssb-edit-ghost').count(),0);
  await page.evaluate(async()=>{const {showTileEditor}=await import('/modules/shadowrun-sprawlbuilder/tile-editing.mjs');canvas.tiles.controlled=[];showTileEditor(null);});assert.equal(await editor.count(),0);
  // Optional actual Pixi EventBoundary regression. No vendor code is bundled.
  if(process.env.FOUNDRY_PIXI_SOURCE){
    await page.addScriptTag({content:fs.readFileSync(process.env.FOUNDRY_PIXI_SOURCE,'utf8')});
    const hits=await page.evaluate(async()=>{
      const {styleTile}=await import('/modules/shadowrun-sprawlbuilder/tile-editing.mjs');
      const root=new PIXI.Container();root.eventMode='static';
      function tile(name,x,y,w,h){
        const t=new PIXI.Container();t.name=name;t.eventMode='static';t.document={x:x+w/2,y:y+h/2,width:w,height:h,rotation:0,texture:{anchorX:.5,anchorY:.5},flags:{'shadowrun-sprawlbuilder':{}}};
        t.frame=t.addChild(new PIXI.Container());t.frame.eventMode='auto';
        t.frame.hitArea={contains:(px,py)=>px>=x&&px<=x+w&&py>=y&&py<=y+h};
        t.controls={border:t.addChild(new PIXI.Graphics()),handles:t.addChild(new PIXI.Container())};
        root.addChild(t);return t;
      }
      tile('road-1',0,0,200,200);tile('road-2',200,0,200,200);
      const curb=tile('curb',80,60,20,120),walk=tile('walk',180,30,40,160),prop=tile('prop',280,80,60,30);
      const parent=root.enableTempParent();root.updateTransform();root.disableTempParent(parent);
      const events=new PIXI.EventBoundary(root),results=[];
      for(const [t,x,y] of [[curb,90,100],[walk,200,100],[prop,300,90]]){
        results.push(events.hitTest(x,y)?.name);
        t.controlled=true;styleTile(t);
        const mark=t.children.at(-1),childCount=t.children.length;
        if(!mark.visible||mark.eventMode!=='none'||mark===t.controls.handles)throw new Error('Missing non-interactive selection mark');
        const shapes=mark.geometry.graphicsData;
        if(t===curb){if(shapes.length!==1||shapes[0].fillStyle.color!==0xff6b35)throw new Error('Expected orange centre dot');}
        else if(shapes.length!==4||shapes[0].lineStyle.color!==0xff6b35)throw new Error('Expected four orange corners');
        for(let i=0;i<10;i++){
          styleTile(t);if(t.children.length!==childCount)throw new Error('Duplicate marks');const target=events.hitTest(x,y);results.push(target?.name);
          let moved=null;target?.once('pointerdown',()=>{moved=target.name;});
          const event=new PIXI.FederatedPointerEvent(events);event.type='pointerdown';event.target=target;
          events.dispatchEvent(event);results.push(moved);
        }
        t.controlled=false;styleTile(t);if(mark.visible)throw new Error('Mark remained after release');
      }
      results.push(events.hitTest(20,20)?.name,events.hitTest(250,20)?.name);
      prop.controlled=true;prop.hasPreview=true;styleTile(prop);
      if(prop.children.at(-1).visible)throw new Error('Original mark remained during drag');
      const preview=tile('preview',280,130,60,30);preview.isPreview=true;preview._original=prop;styleTile(preview);
      if(!preview.children.at(-1).visible)throw new Error('Preview lacks mark');
      preview.destroy({children:true});prop.hasPreview=false;styleTile(prop);
      if(!prop.children.at(-1).visible)throw new Error('Original mark missing after drag');
      // Render the marks too, not only their geometry/event data.
      const app=new PIXI.Application({width:400,height:240,backgroundColor:0x303438,antialias:true});
      document.body.append(app.view);app.view.id='ssb-test-selection';app.stage.addChild(root);
      for(const t of [curb,walk,prop]){t.controlled=true;styleTile(t);}
      const old=prop.children.at(-1);old.destroy();styleTile(prop);
      if(prop.children.at(-1)===old||prop.children.at(-1).destroyed)throw new Error('Mark not recreated after redraw');
      app.renderer.render(app.stage);
      window.selectionTestApp=app;return results;
    });
    assert.deepEqual(hits,[...Array(21).fill('curb'),...Array(21).fill('walk'),...Array(21).fill('prop'),'road-1','road-2']);
    if(process.env.SELECTION_SCREENSHOT)await page.locator('#ssb-test-selection').screenshot({path:process.env.SELECTION_SCREENSHOT});
    await page.evaluate(()=>{selectionTestApp.destroy(true,{children:true});delete window.selectionTestApp;});
    console.log('PASS: actual Pixi hit testing and pointer dispatch retain curb, pavement and prop over overlapping road stamps after selection; corner/dot colour, preview and selection cleanup verified.');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
  console.log('PASS: editor controls, one-pixel field adjustment, ratio unlocking, left/right rotation with wraparound, no corner handle and selection cleanup.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
