import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

test('server checkout retains one commit, protects data and refuses local changes', {skip:process.platform==='win32'}, t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'foundry-history-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const origin=path.join(root,'origin'),server=path.join(root,'server');
  fs.mkdirSync(origin);
  const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git(origin,'init','-b','main');git(origin,'config','user.name','Test');git(origin,'config','user.email','test@example.invalid');
  for(let i=0;i<3;i++){fs.writeFileSync(path.join(origin,'version'),String(i));git(origin,'add','.');git(origin,'commit','-m',`Version ${i}`);}
  git(root,'clone',`file://${origin}`,server);
  fs.mkdirSync(path.join(server,'data'));fs.writeFileSync(path.join(server,'data','world'),'keep');
  fs.mkdirSync(path.join(server,'manual-module'));fs.writeFileSync(path.join(server,'manual-module','keep'),'keep');
  const workflow=fs.readFileSync('.github/workflows/deploy.yml','utf8');
  const block=workflow.slice(workflow.indexOf('            # Nur ein Commit'),workflow.indexOf('            # Docker-Images nur'))
    .split('\n').map(line=>line.replace(/^ {12}/,'')).join('\n');
  const run=(sha=git(origin,'rev-parse','HEAD'))=>spawnSync('bash',['-ec',block.replaceAll('${{ github.sha }}',sha)],{cwd:server,encoding:'utf8'});
  let result=run();assert.equal(result.status,0,result.stderr);assert.equal(git(server,'rev-list','--all','--count'),'1');
  assert.equal(run().status,0);
  fs.writeFileSync(path.join(origin,'version'),'next');git(origin,'commit','-am','Next');
  result=run();assert.equal(result.status,0,result.stderr);assert.equal(git(server,'rev-list','--all','--count'),'1');
  assert.equal(fs.readFileSync(path.join(server,'data','world'),'utf8'),'keep');
  assert.equal(fs.readFileSync(path.join(server,'manual-module','keep'),'utf8'),'keep');
  const before=git(server,'rev-parse','HEAD');assert.notEqual(run('0'.repeat(40)).status,0);assert.equal(git(server,'rev-parse','HEAD'),before);
  fs.writeFileSync(path.join(server,'version'),'local');assert.notEqual(run().status,0);assert.equal(fs.readFileSync(path.join(server,'version'),'utf8'),'local');
  git(server,'restore','version');git(server,'branch','local-work');assert.notEqual(run().status,0);assert.equal(git(server,'rev-parse','local-work'),before);
});
