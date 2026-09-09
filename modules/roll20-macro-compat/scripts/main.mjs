import { executeMacro } from './runtime.mjs';
import { QueryCancelledError, resolveQueries } from './parser.mjs';
import { MODULE_ID, createAdapter, askQuery } from './foundry-adapter.mjs';
const PATCH=Symbol.for(`${MODULE_ID}.execute`);
const distinctive=source=>/\?\{|@\{|%\{|&\{|\[\[|^!|(?:^|\s)#[^\s]+|^\/(?:r|roll|gr|gmroll|sr|secretroll|ssr|supersecretroll|w|whisper|em|me|desc|ooc|as|emas|talktomyself)\b/m.test(source);
async function run(source,scope={}){
  try{return await executeMacro(source,createAdapter(scope));}
  catch(error){if(!(error instanceof QueryCancelledError)){console.error(`${MODULE_ID} |`,error);ui.notifications.error(`Roll20-Makro: ${error.message}`);}return undefined;}
}
Hooks.once('init',()=>{
  for(const [key,name,hint] of [
    ['attributeMappings','Roll20: Attributnamen zuordnen','JSON-Zuordnung: Roll20-Name zu Foundry-Attributpfad, z. B. {"MAG":"attributes.magic"}.'],
    ['abilityMappings','Roll20: Fähigkeiten zuordnen','JSON-Zuordnung: Charakter|Fähigkeit zu einem vorhandenen Foundry-Chat-Makro. Ohne Zuordnung wird ein Makro namens Charakter|Fähigkeit gesucht.']
  ])game.settings.register(MODULE_ID,key,{name,hint,scope:'world',config:true,type:String,default:'{}'});
});
Hooks.once('ready',()=>{
  const proto=CONFIG.Macro.documentClass.prototype;
  if(!proto[PATCH]){
    const original=proto.execute;
    Object.defineProperty(proto,PATCH,{value:true});
    proto.execute=function(...args){
      const mode=this.getFlag(MODULE_ID,'mode')??'auto';
      if(this.type!=='chat'||mode==='native'||(mode!=='roll20'&&!distinctive(this.command??'')))return original.apply(this,args);
      if(!this.canExecute){ui.notifications.warn('Keine Ausführungsrechte für dieses Makro.');return;}
      return run(this.command,args[0]??{});
    };
  }
  game.modules.get(MODULE_ID).api={execute:run,resolve:text=>resolveQueries(text,askQuery)};
  console.info(`${MODULE_ID} | Roll20-Laufzeitübersetzung bereit`);
});
Hooks.on('renderMacroConfig',(app,html)=>{
  const root=html?.querySelector?html:html?.[0],macro=app.document??app.object;
  if(!root||!macro||root.querySelector('[data-r20mc-mode]'))return;
  const group=document.createElement('div');group.className='form-group';group.dataset.r20mcMode='true';
  const label=document.createElement('label');label.textContent='Makrosprache';
  const select=document.createElement('select');select.name=`flags.${MODULE_ID}.mode`;
  for(const [value,text] of [['auto','Automatisch erkennen'],['roll20','Roll20'],['native','Foundry (unverändert)']]){
    const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);
  }
  select.value=macro.getFlag(MODULE_ID,'mode')??'auto';group.append(label,select);
  const type=root.querySelector('[name="type"]')?.closest('.form-group');
  if(type)type.after(group);else (root.querySelector('form')??root).append(group);
});
function chatButtons(message,html){
  const root=html?.querySelector?html:html?.[0];
  if(!root||message.isContentVisible===false)return;
  const actions=message.getFlag(MODULE_ID,'actions');if(!Array.isArray(actions))return;
  root.querySelectorAll('[data-r20mc-action]').forEach(button=>{
    if(button.dataset.r20mcBound)return;button.dataset.r20mcBound='true';
    button.disabled=!message.isAuthor&&!game.user.isGM;
    button.addEventListener('click',async event=>{
      event.preventDefault();event.stopPropagation();
      if(!message.isAuthor&&!game.user.isGM)return;
      const source=actions[Number(button.dataset.r20mcAction)];if(typeof source!=='string')return;
      button.disabled=true;
      try{
        const actor=game.actors.get(message.getFlag(MODULE_ID,'actorId'));
        if(actor&&!actor.isOwner&&!game.user.isGM)throw new Error('Keine Rechte für den Charakter dieses Makros.');
        await run(source,{actor});
      }catch(error){ui.notifications.error(error.message);}finally{button.disabled=false;}
    });
  });
}
Hooks.on('renderChatMessageHTML',chatButtons);
Hooks.on('renderChatMessage',chatButtons);
