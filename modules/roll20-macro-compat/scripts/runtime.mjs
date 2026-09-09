import { bounded, normalizeMacroSource, decodeLegacyEntities, expandReferences, resolveQueries, splitMessages, escapeHTML, LIMITS } from './parser.mjs';
import { compileDice } from './dice.mjs';

function tracker(text) {
  const flags=[...text.matchAll(/&\{tracker(?::([+-]))?\}/g)];
  if(flags.length>1) throw new Error('Pro Würfelformel ist nur eine Tracker-Anweisung erlaubt.');
  return {text:text.replace(/&\{tracker(?::[+-])?\}/g,''),mode:flags.length?(flags[0][1]??'='):null};
}
export function parseContent(text, nesting=0) {
  if(nesting>LIMITS.depth)throw new Error('Inline-Würfe sind zu tief verschachtelt.');
  const nodes=[]; let plain='';
  const flush=()=>{if(plain){nodes.push({type:'text',text:plain});plain='';}};
  for(let i=0;i<text.length;) {
    if(text.startsWith('[[',i)) {
      flush(); let depth=1,j=i+2;
      for(;j<text.length;j++) {
        if(text.startsWith('[[',j)){depth++;j++;}
        else if(text.startsWith(']]',j)){if(--depth===0)break;j++;}
        else if(text[j]==='['){const end=text.indexOf(']',j+1);if(end<0)throw new Error('Würfelbeschriftung nicht geschlossen.');j=end;}
      }
      if(depth)throw new Error('Inline-Wurf [[…]] nicht geschlossen.');
      const flag=tracker(text.slice(i+2,j));
      const children=parseContent(flag.text,nesting+1);
      if(children.some(n=>n.type==='button'))throw new Error('Chat-Buttons sind keine Würfelformeln.');
      nodes.push({type:'inline',children,tracker:flag.mode});i=j+2;
    } else if(text[i]==='[' && /^\[([^\[\]]+)\]\(/.test(text.slice(i))) {
      flush(); const start=text.slice(i).match(/^\[([^\[\]]+)\]\(/);let j=i+start[0].length,depth=1,end=j;
      for(;end<text.length;end++){if(text[end]==='(')depth++;if(text[end]===')'&&--depth===0)break;}
      if(depth)throw new Error('Chat-Link nicht geschlossen.');
      const command=text.slice(j,end);
      let source;
      if(command.startsWith('~'))source=`%{${command.slice(1)}}`;
      else if(/^!\s/.test(command))source=command.slice(1).trim();
      else throw new Error('Unterstützt werden Makro-Buttons [Text](!&#13;/r …) und Ability-Buttons [Text](~Charakter|Fähigkeit).');
      if(!source || source.startsWith('!'))throw new Error('Externe Roll20-API-Skripte sind in Foundry nicht verfügbar.');
      nodes.push({type:'button',label:start[1],source});i=end+1;
    } else {plain+=text[i++];}
  }
  flush();return nodes;
}
const preview=nodes=>nodes.map(n=>n.type==='text'?n.text.replace(/\$\[\[\d+\]\]/g,'1'):n.type==='inline'?'1':'').join('');
function inspect(nodes) {
  for(const node of nodes)if(node.type==='inline'){
    inspect(node.children); compileDice(preview(node.children));
  }
}
function template(body) {
  const match=body.match(/^&\{template:([^}]+)\}\s*/);
  if(!match)return null;
  if(match[1]!=='default')throw new Error(`Die Roll20-Bogenvorlage „${match[1]}“ benötigt einen eigenen Adapter. Unterstützt: default.`);
  const fields=[];let rest=body.slice(match[0].length).trim();
  while(rest) {
    if(!rest.startsWith('{{'))throw new Error('Ungültige default-Vorlage: {{Feld=Wert}} erwartet.');
    // Inline and button expressions may contain braces; balance all braces.
    let braces=2,end=2;
    for(;end<rest.length;end++){
      if(rest[end]==='{')braces++;
      if(rest[end]==='}'&&--braces===0)break;
    }
    if(braces)throw new Error('Vorlagenfeld nicht geschlossen.');
    const field=rest.slice(2,end-1),eq=field.indexOf('=');
    if(eq<0)throw new Error('Vorlagenfeld benötigt einen Namen und „=“.');
    fields.push({name:field.slice(0,eq).trim(),nodes:parseContent(field.slice(eq+1).trim())});
    rest=rest.slice(end+1).trim();
  }
  return fields;
}
export function parseActions(text) {
  if(/\$\[\[\d+\]\]/.test(text))throw new Error('Roll20-Ergebnisreferenzen $[[n]] werden noch nicht unterstützt.');
  const lines=[];
  for(const line of splitMessages(text)){
    if(line.startsWith('{{')&&lines.at(-1)?.includes('&{template:'))lines[lines.length-1]+='\n'+line;
    else lines.push(line);
  }
  if(lines.length>LIMITS.messages)throw new Error(`Maximal ${LIMITS.messages} Nachrichten pro Makro.`);
  const actions=[];let self=false;
  for(const line of lines) {
    if(line.startsWith('!'))throw new Error('Dieses Makro benötigt ein externes Roll20-API-Skript.');
    let body=line,kind='text',audience=self?'self':'public',recipient=null,alias=null;
    const command=line.match(/^\/(\S+)\s*/);
    if(command){
      body=line.slice(command[0].length);const name=command[1].toLowerCase();
      if(name==='talktomyself'){
        if(!/^(on|off)$/i.test(body.trim()))throw new Error('/talktomyself erwartet on oder off.');
        self=body.trim().toLowerCase()==='on';continue;
      }
      if(['r','roll','gr','gmroll','sr','secretroll','ssr','supersecretroll'].includes(name)){
        kind='roll';if(['gr','gmroll'].includes(name))audience='gm';
        if(['sr','secretroll','ssr','supersecretroll'].includes(name))audience='blind';
      } else if(['w','whisper'].includes(name)) {
        const target=body.match(/^(?:"([^"]+)"|(\S+))\s+([\s\S]+)$/);
        if(!target)throw new Error('/w benötigt Empfänger und Nachricht.');
        recipient=target[1]??target[2];body=target[3];audience='whisper';
      } else if(['em','me','emas'].includes(name))kind='emote';
      else if(name==='desc')kind='description';
      else if(name==='ooc')kind='ooc';
      else if(name!=='as')throw new Error(`Roll20-Befehl /${name} wird noch nicht unterstützt.`);
      if(['as','emas'].includes(name)){
        const named=body.match(/^(?:"([^"]+)"|(\S+))\s+([\s\S]+)$/);
        if(!named)throw new Error(`/${name} benötigt Namen und Nachricht.`);
        alias=named[1]??named[2];body=named[3];
      }
    }
    const flag=kind==='roll'?tracker(body):{text:body,mode:null};
    if(kind==='roll')body=flag.text;
    const fields=kind!=='roll'?template(body):null;
    const nodes=fields?null:parseContent(body);
    for(const content of fields?fields.map(f=>f.nodes):[nodes])inspect(content);
    if(kind==='roll')compileDice(preview(nodes),{allowFlavor:true});
    if(/&\{/.test(fields?'':preview(nodes)))throw new Error('Diese Roll20-Rolloption wird noch nicht unterstützt.');
    actions.push({kind,audience,recipient,alias,fields,nodes,tracker:flag.mode});
  }
  return actions;
}
function formatted(text){return escapeHTML(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');}
export async function executeMacro(source, adapter) {
  let text=await expandReferences(normalizeMacroSource(source),adapter);
  text=await resolveQueries(text,adapter.ask);
  text=bounded(decodeLegacyEntities(text));
  const actions=parseActions(text);
  // All command/permission/recipient checks precede rolling or posting any line.
  await adapter.preflight(actions);
  const messages=[],trackers=[],inlineValues=[];let budget=0;
  async function rollExpression(raw, allowFlavor, rolls, track) {
    const input=raw.replace(/\$\[\[(\d+)\]\]/g,(_,index)=>{
      if(inlineValues[index]===undefined)throw new Error(`Inline-Wurf $[[${index}]] ist noch nicht verfügbar.`);
      return String(inlineValues[index]);
    });
    const compiled=compileDice(input,{allowFlavor});
    if((budget+=compiled.diceCount)>LIMITS.dice)throw new Error('Würfelgrenze dieses Makros überschritten.');
    const roll=await adapter.roll(compiled.formula);
    if(!Number.isFinite(roll.total))throw new Error('Der Wurf lieferte kein endliches Ergebnis.');
    rolls.push(roll);
    if(track)trackers.push({mode:track,total:roll.total});
    return {roll,compiled};
  }
  async function content(nodes,rolls,buttons) {
    let html='',numeric='';
    for(const node of nodes){
      if(node.type==='text'){html+=formatted(node.text);numeric+=node.text;}
      else if(node.type==='button'){
        const id=buttons.push(node.source)-1;
        html+=`<button type="button" class="r20mc-button" data-r20mc-action="${id}">${escapeHTML(node.label)}</button>`;
      }else{
        const inner=await content(node.children,rolls,buttons);
        const {roll,compiled}=await rollExpression(inner.numeric,false,rolls,node.tracker);
        inlineValues.push(roll.total);numeric+=`(${roll.total})`;
        const dice=roll.dice?.flatMap(die=>die.results?.map(result=>result.active===false?`(${result.result})`:result.result)??[])??[];
        const detail=inner.numeric.trim()+' = '+roll.total+(dice.length?' · Würfel: '+dice.join(', '):'');
        html+=`<span class="r20mc-inline" title="${escapeHTML(detail)}">${roll.total}</span>`;
      }
    }
    return {html,numeric};
  }
  for(const action of actions){
    const rolls=[],buttons=[];let html;
    if(action.fields){
      let title='';const rows=[];
      for(const field of action.fields){
        const result=await content(field.nodes,rolls,buttons);
        if(field.name==='name')title=result.html;
        else rows.push(`<tr><th>${escapeHTML(field.name)}</th><td>${result.html}</td></tr>`);
      }
      html=`<section class="r20mc-card"><h3>${title||'Wurf'}</h3><table><tbody>${rows.join('')}</tbody></table></section>`;
    }else{
      const result=await content(action.nodes,rolls,buttons);
      if(action.kind==='roll'){
        const {roll,compiled}=await rollExpression(result.numeric,true,rolls,action.tracker);
        html=`<section class="r20mc-card"><div>${escapeHTML(compiled.flavor||result.numeric.trim())}</div><strong class="r20mc-total">${roll.total}</strong></section>`;
      }else html=`<div class="r20mc-${action.kind}">${result.html}</div>`;
    }
    messages.push({...action,html,rolls,buttons});
  }
  return adapter.commit(messages,trackers);
}
