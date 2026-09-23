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
    const masks=await page.evaluate(async()=>{const {renderBuilding}=await import('/modules/shadowrun-sprawlbuilder/buildings.mjs');const image=document.createElement('canvas');image.width=image.height=4;const result={};for(const [side,point] of Object.entries({north:[540,140],south:[540,740],west:[140,440],east:[940,440]})){const options={bounds:{x:0,y:0,width:800,height:600},ppm:100,asset:{widthMeters:4,heightMeters:4},image,part:`wall-${side}`};const sample=walls=>renderBuilding({...options,walls}).surface.getContext('2d').getImageData(...point,1,1).data[3];result[side]=[sample({}),sample({[side]:false})];}return result;});
    for(const values of Object.values(masks)){assert(values[0]>200);assert.equal(values[1],0);}
    await page.evaluate(async()=>{(await import('/modules/shadowrun-sprawlbuilder/building-parts.mjs')).registerBuildingParts();await (await import('/modules/shadowrun-sprawlbuilder/buildings.mjs')).showBuildings();});
    const panel=page.locator('.ssb-building-panel');await panel.waitFor();
    await page.mouse.click(50,950,{button:'right'});
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.ssb-building-overlay')).pointerEvents),'none');
    assert.notEqual(await page.evaluate(()=>document.elementFromPoint(50,950)?.className),'ssb-building-overlay');
    await panel.getByRole('button',{name:'Fortsetzen'}).click();
    assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.ssb-building-overlay')).pointerEvents),'auto');
    await panel.getByLabel('Gebäudeform').selectOption('l');await panel.getByLabel('Balkonseite').selectOption('south');
    await panel.getByLabel('Wand oben',{exact:true}).uncheck();await panel.getByLabel('Wand links',{exact:true}).uncheck();
    await page.mouse.move(100,200);await page.mouse.down();await page.mouse.move(600,800,{steps:5});await page.mouse.up();
    await page.waitForFunction(()=>created.length===7);
    const first=await page.evaluate(()=>({tile:created[0],upload:uploads[0],errors:window.errors}));
    assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].building,true);assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].shape,'l');assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].balcony,'south');
    assert.deepEqual(first.tile.flags['shadowrun-sprawlbuilder'].footprint,{x:100,y:200,width:600,height:700});
    assert.equal(first.tile.levels[0],'ground');assert.equal(first.tile.elevation,0);assert.match(first.upload.folder,/shadowrun-sprawlbuilder-buildings$/);
    assert.equal(first.tile.flags['shadowrun-sprawlbuilder'].footprintUV.length,4);
    const pixels=await page.evaluate(async()=>{async function sample(role,x,y){const img=new Image();img.src=created.find(d=>d.flags['shadowrun-sprawlbuilder'].buildingPart===role).texture.src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(x,y,1,1).data[3];}return {roof:await sample('roof',240,440),missingCorner:await sample('roof',640,240),balcony:await sample('balcony',440,890),opening:await sample('wall-south',440,840),wall:await sample('wall-south',240,840)};});
    assert(pixels.roof>200,'Dachfläche sichtbar');assert.equal(pixels.missingCorner,0,'L-Aussparung transparent');assert(pixels.balcony>200,'Balkon sichtbar');
    assert.equal(pixels.opening,0);assert(pixels.wall>200);
    assert.equal(await page.evaluate(()=>created.find(d=>d.flags['shadowrun-sprawlbuilder'].buildingPart==='roof').elevation),3);
    await panel.getByRole('button',{name:'Gebäude bearbeiten',exact:true}).click();const editor=page.locator('.ssb-building-editor');await editor.waitFor();assert.equal(await panel.count(),0);
    assert.equal(await editor.getByLabel('Wand oben',{exact:true}).isChecked(),false);await editor.getByLabel('Wand oben',{exact:true}).check();
    await page.waitForFunction(()=>!created.find(d=>d.flags['shadowrun-sprawlbuilder'].buildingPart==='wall-north').hidden);
    await editor.getByRole('button',{name:'Innenraum bearbeiten · nur bei mir'}).click();
    const local=()=>page.evaluate(async()=>{const {buildingPartInvisible}=await import('/modules/shadowrun-sprawlbuilder/building-parts.mjs');const roof=created.find(d=>d.flags['shadowrun-sprawlbuilder'].buildingPart==='roof');return {hidden:buildingPartInvisible(roof),storedHidden:roof.hidden,alpha:roof.alpha};});
    assert.deepEqual(await local(),{hidden:true,storedHidden:false,alpha:1});
    await page.evaluate(()=>canvas.scene.updateEmbeddedDocuments('Tile',[{_id:created[0].id,x:250,width:1760,rotation:90}]));
    await page.waitForFunction(()=>created.every(d=>d.x===250&&d.width===1760&&d.rotation===90));
    await editor.getByRole('button',{name:'Schließen',exact:true}).click();assert.deepEqual(await local(),{hidden:false,storedHidden:false,alpha:1});
    await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/building-parts.mjs')).showBuildingEditor();});await editor.waitFor();assert.equal(await editor.getByLabel('Wand oben',{exact:true}).isChecked(),true);assert.equal(await editor.getByLabel('Wand links',{exact:true}).isChecked(),false);
    await page.evaluate(async()=>{await (await import('/modules/shadowrun-sprawlbuilder/buildings.mjs')).showBuildings();});
    await panel.getByRole('button',{name:'Letztes Gebäude zurücknehmen'}).click();await page.waitForFunction(()=>docs.size===0);
    await panel.getByLabel('Gebäudeform').selectOption('rectangle');await panel.getByLabel('Balkonseite').selectOption('none');
    await panel.getByLabel('Fassadenansicht').selectOption('north');
    await page.mouse.move(120,100);await page.mouse.down();await page.mouse.move(600,500,{steps:4});await page.mouse.up();await page.waitForFunction(()=>created.length===13);
    assert.equal(await page.evaluate(()=>created[7].flags['shadowrun-sprawlbuilder'].facing),'north');
    const failed=await page.evaluate(async()=>{const {loadCatalog,assetPath}=await import('/modules/shadowrun-sprawlbuilder/catalog.mjs');const {saveBuilding}=await import('/modules/shadowrun-sprawlbuilder/buildings.mjs');const asset=(await loadCatalog()).find(a=>a.key==='boden-beton-01'),image=new Image();image.src=assetPath(asset);await image.decode();const picker=foundry.applications.apps.FilePicker.implementation,original=picker.upload,before=docs.size;let calls=0;picker.upload=async(...args)=>++calls===2?{error:'simulierter Upload-Abbruch'}:original(...args);try{await saveBuilding({scene:canvas.scene,level:canvas.level,bounds:{x:0,y:0,width:500,height:500},ppm:100,shape:'rectangle',balcony:'none',facing:'south',asset,image});return {unexpected:true};}catch(error){return {message:error.message,before,after:docs.size};}finally{picker.upload=original;}});
    assert.match(failed.message,/Upload-Abbruch/);assert.equal(failed.before,failed.after);
    if(process.env.SSB_PREVIEW_PATH){
      const picture=await page.evaluate(async()=>{const result=document.createElement('canvas');result.width=1500;result.height=700;const ctx=result.getContext('2d');ctx.fillStyle='#252b30';ctx.fillRect(0,0,result.width,result.height);const group=created.slice(0,7);for(const [index,label] of ['Außenansicht','Links ausgeblendet','Innenansicht'].entries()){ctx.fillStyle='#edf2ef';ctx.font='22px sans-serif';ctx.fillText(label,30+index*500,40);for(const doc of [...group].sort((a,b)=>a.elevation-b.elevation||a.sort-b.sort)){const role=doc.flags['shadowrun-sprawlbuilder'].buildingPart;if(index===1&&role==='wall-west'||index===2&&role==='roof')continue;const image=new Image();image.src=doc.texture.src;await image.decode();ctx.drawImage(image,20+index*500,60,440,490);}}return result.toDataURL('image/png').split(',')[1];});fs.writeFileSync(process.env.SSB_PREVIEW_PATH,Buffer.from(picture,'base64'));
    }
    await page.evaluate(()=>Hooks.callAll('canvasTearDown'));assert.equal(await panel.count(),0);
    assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.errors),[]);
    console.log('Buildings passed: separate parts, side visibility, balcony pixels, local interior mode, grouped transforms, persistent edit, own undo and cleanup.');
  }finally{await browser?.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
