import { escapeHTML, QueryCancelledError } from './parser.mjs';
export const MODULE_ID='roll20-macro-compat';
const normalize=name=>String(name).trim().toLowerCase();
const values=collection=>Array.from(collection?.values?.()??collection??[]);
const aliases={konstitution:'body',body:'body',geschicklichkeit:'agility',agility:'agility',reaktion:'reaction',reaction:'reaction',stärke:'strength',strength:'strength',willenskraft:'willpower',willpower:'willpower',logik:'logic',logic:'logic',intuition:'intuition',charisma:'charisma',magie:'magic',magic:'magic',resonanz:'resonance',resonance:'resonance',edge:'edge'};

export function safePath(object, path) {
  for(const segment of String(path).replace(/^system\./,'').split('.')){
    if(['__proto__','prototype','constructor'].includes(segment))throw new Error('Ungültiger Attributpfad.');
    if(object===null || typeof object!=='object')return undefined;
    const key=Object.keys(object).find(key=>normalize(key)===normalize(segment));
    if(key===undefined)return undefined;
    object=object[key];
  }
  return object;
}
function mappings(key) {
  const value=game.settings.get(MODULE_ID,key);
  try{const result=JSON.parse(value||'{}');if(!result||Array.isArray(result)||typeof result!=='object')throw new Error();return result;}
  catch{throw new Error(`Ungültige Zuordnung in den Moduleinstellungen (${key}).`);}
}
export async function askQuery(query) {
  const options=query.options?.map((option,index)=>`<option value="${index}">${escapeHTML(option.label)}</option>`).join('');
  const field=query.type==='select'?`<select name="answer" autofocus>${options}</select>`:
    `<input name="answer" type="text" value="${escapeHTML(query.defaultValue)}" autofocus>`;
  const result=await foundry.applications.api.DialogV2.input({window:{title:query.prompt||'Roll20-Abfrage'},content:`<div class="r20mc-query"><label>${escapeHTML(query.prompt)}${field}</label></div>`,ok:{label:'Weiter'},rejectClose:false,modal:true});
  if(result===null||result===undefined)return null;
  return query.type==='select'?query.options[Number(result.answer)]?.value:String(result.answer??'');
}
function unique(collection,name,label) {
  const candidates=values(collection).filter(entry=>normalize(entry.name)===normalize(name)||entry.id===name);
  if(candidates.length!==1)throw new Error(candidates.length?`${label} „${name}“ ist mehrdeutig.`:`${label} „${name}“ wurde nicht gefunden.`);
  return candidates[0];
}
export function createAdapter(scope={}) {
  const targets=new Map();let combatant=null,combat=null,trackerToken=null;
  const controlled=[...(canvas?.tokens?.controlled??[])];
  function selected() {
    if(scope.token)return scope.token.object??scope.token;
    const list=controlled;
    if(list.length>1)throw new Error('Bitte genau einen Token auswählen.');
    return list[0]??null;
  }
  function currentActor(){return scope.actor??selected()?.actor??game.user.character;}
  function readable(actor){
    if(!actor)throw new Error('Bitte einen Charakter zuweisen oder einen Token auswählen.');
    if(!game.user.isGM&&!actor.testUserPermission(game.user,'OBSERVER'))throw new Error(`Keine Leserechte für „${actor.name}“.`);
    return actor;
  }
  async function target(label='Ziel') {
    if(targets.has(label))return targets.get(label);
    const aimed=values(game.user.targets);
    const choices=aimed.length?aimed:values(canvas?.tokens?.placeables).filter(token=>token.visible);
    if(!choices.length)throw new Error('Kein sichtbarer Zieltoken verfügbar.');
    let token;
    if(aimed.length===1)token=aimed[0];
    else{
      const result=await foundry.applications.api.DialogV2.input({window:{title:`Ziel: ${label}`},content:`<select name="target">${choices.map((t,i)=>`<option value="${i}">${escapeHTML(t.name)}</option>`).join('')}</select>`,ok:{label:'Auswählen'},rejectClose:false,modal:true});
      if(result===null)throw new QueryCancelledError();
      token=choices[Number(result.target)];
    }
    if(!token)throw new Error('Kein Ziel ausgewählt.');targets.set(label,token);return token;
  }
  async function reference(body) {
    const parts=body.split('|').map(s=>s.trim());
    let actor,token,attribute,max=false;
    if(normalize(parts[0])==='target'){
      if(parts.length<2||parts.length>4)throw new Error(`Ungültiger Zielbezug: ${body}`);
      token=await target(parts.length>=3?parts[1]:'Ziel');actor=token.actor;
      attribute=parts.length>=3?parts[2]:parts[1];max=normalize(parts[3])==='max';
    }else if(parts.length===1){actor=currentActor();token=selected();attribute=parts[0];}
    else{
      if(parts.length>3)throw new Error(`Ungültiger Attributbezug: ${body}`);
      if(normalize(parts[0])==='selected'){token=selected();actor=token?.actor;}
      else actor=unique(game.actors,parts[0],'Charakter');
      attribute=parts[1];max=normalize(parts[2])==='max';
    }
    const key=normalize(attribute);
    if(key==='token_name'&&token)return token.name;
    readable(actor);
    if(key==='character_name')return actor.name;
    if(key==='character_id')return actor.id;
    if(key==='token_id'&&token)return token.id;
    if(/^bar[123]$/.test(key)){
      const bar=token?.document?.getBarAttribute(key);
      const value=bar?.[max?'max':'value'];
      if(value!==undefined)return value;
      throw new Error(`Token-Balken ${attribute} ist nicht zugeordnet (Foundry besitzt standardmäßig nur zwei Balken).`);
    }
    const map=mappings('attributeMappings');
    const mapped=Object.keys(map).find(k=>normalize(k)===key);
    const data=actor.getRollData?.()??actor.system;
    const candidatePaths=mapped?[map[mapped]]:[attribute, ...(aliases[key]?[`attributes.${aliases[key]}`,aliases[key]]:[])];
    for(const candidate of candidatePaths){
      if(typeof candidate!=='string')throw new Error('Attributzuordnungen müssen Pfade als Text enthalten.');
      let value=safePath(actor.system,candidate)??safePath(data,candidate);
      if(value&&typeof value==='object')value=max?value.max:(value.value??value.pool??value.base);
      else if(max)value=undefined;
      if(typeof value==='number'||typeof value==='string')return String(value);
    }
    throw new Error(`Attribut „${attribute}“ fehlt bei „${actor.name}“. Die Spielleitung kann den Roll20-Namen in den Moduleinstellungen einem Foundry-Attribut zuordnen.`);
  }
  function macroSource(name) {
    const macro=unique(game.macros,name,'Makro');
    if(!macro.canExecute)throw new Error(`Keine Ausführungsrechte für Makro „${name}“.`);
    if(macro.type!=='chat')throw new Error(`„${name}“ ist ein Script-Makro; Roll20-Aufrufe dürfen nur Chat-Makros aufrufen.`);
    return macro.command;
  }
  async function ability(body){
    const parts=body.split('|');if(parts.length!==2)throw new Error(`Ability benötigt Charakter und Namen: ${body}`);
    const actor=readable(normalize(parts[0])==='selected'?selected()?.actor:normalize(parts[0])==='target'?(await target()).actor:unique(game.actors,parts[0],'Charakter'));
    const map=mappings('abilityMappings'),key=`${actor.name}|${parts[1]}`;
    const mapped=Object.keys(map).find(k=>normalize(k)===normalize(key));
    const command=macroSource(mapped?map[mapped]:key);
    // Unqualified attributes in a character ability belong to that character.
    return command.replace(/@\{([^{}|]+)\}/g,(_,attribute)=>`@{${actor.name}|${attribute}}`);
  }
  function recipients(name){
    if(['gm','spielleitung'].includes(normalize(name)))return values(game.users).filter(u=>u.isGM).map(u=>u.id);
    if(['self','me'].includes(normalize(name)))return [game.user.id];
    const users=values(game.users).filter(u=>normalize(u.name)===normalize(name));
    if(users.length)return users.map(u=>u.id);
    const actor=unique(game.actors,name,'Flüster-Empfänger');
    return values(game.users).filter(u=>!u.isGM&&actor.testUserPermission(u,'OWNER')).map(u=>u.id);
  }
  function hasTracker(action){
    const visit=nodes=>nodes?.some(node=>node.tracker||visit(node.children));
    return action.tracker||visit(action.nodes)||action.fields?.some(field=>visit(field.nodes));
  }
  return {
    ask:askQuery,attribute:reference,macro:macroSource,ability,
    async preflight(actions){
      for(const action of actions){
        action.whisper=[];action.blind=false;
        if(action.audience!=='public'){
          let ids=action.audience==='self'?[game.user.id]:recipients(action.audience==='whisper'?action.recipient:'gm');
          if(!ids.length)throw new Error('Keine Empfänger gefunden; die private Nachricht wird nicht öffentlich gesendet.');
          if(action.audience!=='blind')ids=[...new Set([...ids,game.user.id])];
          action.whisper=ids;action.blind=action.audience==='blind';
        }
        if(action.alias&&!game.user.isGM){
          const actor=unique(game.actors,action.alias,'Sprecher');
          if(!actor.isOwner)throw new Error(`Keine Rechte, als „${action.alias}“ zu sprechen.`);
        }
      }
      if(actions.some(hasTracker)){
        trackerToken=selected();combat=game.combat;
        if(!trackerToken||!combat)throw new Error('Tracker benötigt einen ausgewählten Token und einen vorhandenen Kampf.');
        combatant=combat.getCombatantByToken(trackerToken.id);
        if(combatant?!combatant.canUserModify(game.user,'update'):!game.user.isGM)throw new Error('Keine Rechte zum Ändern dieses Initiative-Eintrags.');
      }
    },
    async roll(formula){return new foundry.dice.Roll(formula).evaluate();},
    async commit(messages,trackers){
      if(trackers.length){
        if(!combatant)[combatant]=await combat.createEmbeddedDocuments('Combatant',[{tokenId:trackerToken.id,actorId:trackerToken.actor?.id,sceneId:canvas.scene.id}]);
        let initiative=combatant.initiative??0;
        for(const entry of trackers)initiative=entry.mode==='+'?initiative+entry.total:entry.mode==='-'?initiative-entry.total:entry.total;
        await combat.setInitiative(combatant.id,initiative);
      }
      const Chat=CONFIG.ChatMessage.documentClass;
      const actor=currentActor();
      const speaker=scope.speaker??Chat.getSpeaker({actor,token:selected()?.document??selected()});
      return Chat.createDocuments(messages.map(message=>({
        author:game.user.id,speaker:message.kind==='ooc'?{alias:game.user.name}:message.alias?{...speaker,alias:message.alias}:speaker,
        content:message.html,rolls:message.rolls,whisper:message.whisper,blind:message.blind,
        style:message.rolls.length?CONST.CHAT_MESSAGE_STYLES.ROLL:message.kind==='emote'?CONST.CHAT_MESSAGE_STYLES.EMOTE:CONST.CHAT_MESSAGE_STYLES.OTHER,
        flags:{[MODULE_ID]:{actions:message.buttons,actorId:actor?.id??null}}
      })));
    }
  };
}
