import { LIMITS } from './parser.mjs';

// A small expression parser, not a textual find/replace or JavaScript evaluator.
// Roll20 comparisons are inclusive; cs/cf are visual critical markers, not counts.
export function compileDice(source, {allowFlavor = false} = {}) {
  let i = 0, depth = 0, diceCount = 0;
  const skip = () => { while (/\s/.test(source[i] ?? '') && i < source.length) i++; };
  const error = text => { throw new SyntaxError(`${text} (Würfelformel, Position ${i+1})`); };
  function take(regex) { skip(); const match=source.slice(i).match(regex); if (!match) return null; i+=match[0].length; return match[0]; }
  function expect(c) { skip(); if (source[i]!==c) error(`„${c}“ erwartet`); i++; }
  function point(required=false) {
    const save=i;
    const op=take(/^(?:>=|<=|>|<|=)/);
    const value=take(/^-?\d+(?:\.\d+)?/);
    if (!value) { i=save; if (required || op) error('Vergleichswert fehlt'); return null; }
    return {op:op?.startsWith('>')?'>=':op?.startsWith('<')?'<=':'=',value:Number(value)};
  }
  const cp=p=>p?`${p.op}${p.value}`:'';
  const always=(p,faces)=>{
    if(!p)return faces===1;
    const min=faces==='F'?-1:1,max=faces==='F'?1:faces;
    return Number.isFinite(max)&&((p.op==='>='&&p.value<=min)||(p.op==='<='&&p.value>=max)||(min===max&&p.value===min));
  };
  function modifiers(node) {
    let successes=false;
    for (let n=0;n<30;n++) {
      skip(); const before=i;
      if (take(/^!!|^!p/)) error('Zusammengezählte oder durchschlagende Explosionen werden noch nicht unterstützt');
      if (take(/^!/)) {
        const p=point();
        if(always(p,node.faces)) error('Diese Explosion würde endlos würfeln');
        node.code+=`x${cp(p)}`;
      } else if (take(/^ro/)) node.code+=`r${cp(point(true))}`;
      else if (take(/^r(?!ound)/)) {
        const p=point(true);
        if(always(p,node.faces)) error('Diese Wiederholung würde endlos würfeln');
        node.code+=`rr${cp(p)}`;
      } else if (take(/^cs|^cf/)) error('Roll20-Kritisch-Markierungen cs/cf werden noch nicht unterstützt; sie sind keine Erfolgszählung');
      else {
        const keep=take(/^(?:kh|kl|dh|dl|k|d)(?=\d)/);
        if (keep) node.code+=`${({k:'kh',d:'dl'}[keep]??keep)}${take(/^\d+/)}`;
        else if (take(/^f/)) {
          if (!successes) error('Fehlerzählung benötigt eine Erfolgsbedingung');
          node.code+=`df${cp(point(true))}`;
        } else if (/^[<>=]/.test(source.slice(i))) { node.code+=`cs${cp(point(true))}`; successes=true; }
        else if (take(/^s[ad]?/)) error('Sortiermodifikatoren werden noch nicht unterstützt');
        else break;
      }
      if (i===before) break;
    }
    return node;
  }
  function atom() {
    if (++depth>LIMITS.depth) error('Formel zu tief verschachtelt');
    skip(); let node;
    const fn=take(/^(?:floor|ceil|round|abs)(?=\s*\()/);
    if (fn) {
      expect('('); const argument=expression(0); expect(')');
      node={code:`${fn}(${argument.code})`,value:argument.value===null?null:Math[fn](argument.value)};
    } else if (take(/^\(/)) {
      const inner=expression(0); expect(')'); node={...inner,code:`(${inner.code})`};
    } else if (take(/^\{/)) {
      const group=[expression(0)];
      while(take(/^,/)) group.push(expression(0));
      expect('}');
      // A single bare dice group operates on individual dice in Roll20.
      if (group.length===1) {
        if (!group[0].dice) error('Einzelgruppen mit arithmetischen Modifikatoren werden noch nicht unterstützt');
        node=modifiers({...group[0]});
      } else node=modifiers({code:`{${group.map(x=>x.code).join(',')}}`,value:null,dice:false});
    } else {
      const number=take(/^\d+(?:\.\d+)?/);
      if (number) node={code:number,value:Number(number)};
      else if (/^d(?:\d|F|\()/i.test(source.slice(i))) node={code:'1',value:1};
      else error('Zahl, Würfel oder erlaubte Rechenfunktion erwartet');
    }
    if (take(/^d(?=\d|F|\()/i)) {
      if (node.value===null || !Number.isFinite(node.value)) error('Würfelanzahl muss berechenbar sein');
      const count=Math.round(node.value);
      if (count<0 || count>LIMITS.dice || (diceCount+=count)>LIMITS.dice) error(`Maximal ${LIMITS.dice} Würfel pro Formel`);
      let faces;
      if (take(/^F/i)) faces='F';
      else if (take(/^\(/)) { const face=expression(0); expect(')'); faces=face.value; }
      else faces=Number(take(/^\d+/));
      if (faces!=='F' && (!Number.isInteger(faces)||faces<1||faces>1000000)) error('Ungültige Seitenzahl');
      node=modifiers({code:`${count}d${faces==='F'?'f':faces}`,value:null,dice:true,faces});
    }
    while(take(/^\[/)) {
      const end=source.indexOf(']',i); if(end<0) error('Würfelbeschriftung nicht geschlossen');
      const label=source.slice(i,end); if (/[\[\]\r\n]/.test(label)) error('Ungültige Würfelbeschriftung');
      node.code+=`[${label}]`; i=end+1;
    }
    depth--; return node;
  }
  function expression(min) {
    skip(); let left;
    const sign=take(/^[+-]/);
    if(sign) { const next=expression(25); left={code:`${sign}${next.code}`,value:next.value===null?null:(sign==='-'?-next.value:next.value)}; }
    else left=atom();
    while(true) {
      skip(); const op=source.slice(i).match(/^(?:\*\*|[+\-*/%])/ )?.[0];
      const precedence=op==='**'?30:/^[*/%]$/.test(op??'')?20:op?10:0;
      if(!op||precedence<min) break;
      i+=op.length; const right=expression(precedence+(op==='**'?0:1));
      let value=null;
      if(left.value!==null&&right.value!==null) {
        const a=left.value,b=right.value;
        value=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:op==='%'?a%b:a**b;
        if(!Number.isFinite(value)) error('Rechenergebnis ist nicht endlich');
      }
      left={code:`${left.code}${op}${right.code}`,value};
    }
    return left;
  }
  const node=expression(0); skip();
  let flavor=source.slice(i).trim();
  if(flavor && (!allowFlavor || !/^(?:\\|[\p{L}])/u.test(flavor))) error(`Nicht unterstützte Würfelsyntax: ${flavor.slice(0,30)}`);
  if (/^(?:cs|cf|mt|r\d|t\[|s[ad]?\b)/.test(flavor)) error(`Nicht unterstützter Würfelmodifikator: ${flavor}`);
  return {formula:node.code,flavor:flavor.replace(/^\\\s*/,''),diceCount};
}
