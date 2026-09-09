import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileDice} from '../scripts/dice.mjs';
import {resolveQueries,expandReferences,decodeLegacyEntities,QueryCancelledError,findFirstQuery} from '../scripts/parser.mjs';
import {executeMacro,parseActions} from '../scripts/runtime.mjs';
const fixture=name=>fs.readFileSync(new URL(`fixtures/${name}.txt`,import.meta.url),'utf8');
function adapter(answers={},totals=[]) {
  const asked=[],formulas=[],commits=[];
  return {asked,formulas,commits,
    ask:async query=>{asked.push(query.prompt);return answers[query.prompt]??query.defaultValue??query.options[0].value;},
    macro:async name=>{throw new Error(`Macro missing: ${name}`);},
    attribute:async name=>{throw new Error(`Attribute missing: ${name}`);},
    ability:async name=>{throw new Error(`Ability missing: ${name}`);},
    preflight:async()=>{},
    roll:async formula=>{formulas.push(formula);return {formula,total:totals.shift()??2};},
    commit:async(messages,trackers)=>{commits.push({messages,trackers});return messages;}
  };
}
test('acceptance: spirit macro is unchanged, cached level, nested dice and Edge button',async()=>{
  const text=fixture('geist');
  const a=adapter({'Stufe':'3','Geister Art':'Luftgeist','Wie viel Edge für Beschwören einsetzen (= Anzahl Rerolls)?':'2'},[4,6,3,5,6,2,1]);
  const messages=await executeMacro(text,a);
  assert.equal(a.asked.filter(p=>p==='Stufe').length,1);
  assert.deepEqual(a.formulas,['11d6cs>=5','3*2','6d6cs>=5','12d6cs>=5','3*2','6d6cs>=5','4d6cs>=5']);
  assert.equal(messages.length,1);
  assert.deepEqual(messages[0].buttons,['/r 2d6>5']);
  assert.match(messages[0].html,/Geist beschwören/);
  assert.match(messages[0].html,/data-r20mc-action="0"/);
  assert.equal(text,fixture('geist'));
  const click=adapter({},[1]);
  await executeMacro(messages[0].buttons[0],click);
  assert.deepEqual(click.formulas,['2d6cs>=5']);
});
test('acceptance: multiline drain template remains one message',async()=>{
  const a=adapter({'Wie hoch ist der Entzug?':'7','Willenskraft + Charisma':'12'},[3]);
  const result=await executeMacro(fixture('entzug'),a);
  assert.equal(result.length,1);
  assert.deepEqual(a.formulas,['7-(12d6cs>=5)']);
  assert.match(result[0].html,/Restschaden/);
});
test('acceptance: five success pools use one query and an inclusive group threshold',async()=>{
  const a=adapter({'Würfelpool':'6','Schwellwert':'3'},[4]);
  const result=await executeMacro(fixture('proben'),a);
  assert.deepEqual(a.asked,['Würfelpool','Schwellwert']);
  assert.deepEqual(a.formulas,['{6d6cs>=4,6d6cs>=4,6d6cs>=4,6d6cs>=4,6d6cs>=4}cs>=3']);
  assert.match(result[0].html,/x Schwellwert erreicht/);
});
test('documented dice notation translates without changing comparison semantics',()=>{
  for(const [source,expected] of [
    ['d20+5','1d20+5'],['10d6<4','10d6cs<=4'],['3d6>3f1','3d6cs>=3df=1'],
    ['6d6!','6d6x'],['2d8r<2','2d8rr<=2'],['2d8ro1','2d8r=1'],
    ['4d6d1','4d6dl1'],['2d20k1','2d20kh1'],['4dF+1','4df+1'],
    ['(2+3)d6>5','5d6cs>=5'],['floor(7/2)+1d6','floor(7/2)+1d6'],
    ['{6d6!}>5','6d6xcs>=5'],['{1d6,1d8}kh1','{1d6,1d8}kh1']
  ])assert.equal(compileDice(source).formula,expected,source);
});
test('unsupported and runaway dice fail explicitly instead of silently changing meaning',()=>{
  for(const source of ['6d6!!','6d6!p','1d20cs>19','3d6mt','1t[Table]','1001d6','1d1!','1d6r>1','globalThis.alert(1)','(1/0)d6'])assert.throws(()=>compileDice(source),source);
});
test('query parsing protects attributes and nested encoded separators',async()=>{
  assert.equal(findFirstQuery('?{A|X,@{selected|logic}|Y,2}').body,'A|X,@{selected|logic}|Y,2');
  const questions=[];
  const text=await resolveQueries('?{Action|Attack,?{Bonus&#124;2&#125;|Defend,0}',async q=>{
    questions.push(q.prompt);return q.type==='select'?q.options[0].value:q.defaultValue;
  });
  assert.equal(text,'2');assert.deepEqual(questions,['Action','Bonus']);
  assert.equal(decodeLegacyEntities('&amp;#125;'),'&#125;');
});
test('repeated queries are asked once per execution, not globally',async()=>{
  let count=0;
  assert.equal(await resolveQueries('?{A|2}+?{A}',async()=>{count++;return '3';}),'3+3');
  assert.equal(count,1);
  await resolveQueries('?{A}',async()=>{count++;return '4';});assert.equal(count,2);
});
test('macro and ability expansion preserves original text and rejects cycles',async()=>{
  const resolver={macro:async name=>name==='attack'?'/r @{selected|pool}d6>5':'#cycle',attribute:async()=> '12',ability:async()=> '#attack'};
  assert.equal(await expandReferences('%{A|Attack}',resolver),'/r 12d6>5');
  await assert.rejects(expandReferences('#cycle',resolver),/Rekursiver/);
});
test('cancel or invalid later line sends no partial chat output',async()=>{
  const a=adapter();a.ask=async()=>null;
  await assert.rejects(executeMacro('/r 1d6\n?{Stop}',a),QueryCancelledError);
  assert.equal(a.formulas.length,0);assert.equal(a.commits.length,0);
  await assert.rejects(executeMacro('/r 1d6\n!powercards',a),/API/);
  assert.equal(a.formulas.length,0);
});
test('whispers and trackers keep their intent in prepared actions',()=>{
  const [a,b,c]=parseActions('/w "Game Master" Hidden [[1d6]]\n/gmroll 1d20\n/r 1d6 &{tracker:+}');
  assert.equal(a.audience,'whisper');assert.equal(a.recipient,'Game Master');
  assert.equal(b.audience,'gm');assert.equal(c.tracker,'+');
});
test('query text cannot inject HTML into rendered output',async()=>{
  const a=adapter({Name:'<img src=x onerror=alert(1)>'});
  const [message]=await executeMacro('&{template:default} {{name=?{Name}}}',a);
  assert.ok(!message.html.includes('<img'));assert.match(message.html,/&lt;img/);
});
