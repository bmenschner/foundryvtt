import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validate} from './deploy-modules.mjs';
function walk(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);}
console.log('Managed packages:',validate('modules').map(m=>`${m.id} ${m.version}`).join(', '));
const moduleFiles=walk('modules');
for(const file of moduleFiles.filter(file=>file.endsWith('.mjs'))){
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status??1);
}
const tests=[...walk('tests'),...moduleFiles].filter(file=>file.endsWith('.test.mjs'));
const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit'});
process.exitCode=result.status??1;
