import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';

test('file deployment works without Git and preserves host data through migration and retries', {skip:process.platform==='win32'},t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'foundry-transfer-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const repo=path.join(temp,'repo'),home=path.join(temp,'home'),host=path.join(home,'foundry'),bin=path.join(temp,'bin');
  for(const dir of [repo,host,bin])fs.mkdirSync(dir,{recursive:true});
  const put=(file,text)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
  for(const file of ['scripts/deploy-server.sh','scripts/publish-deployment.sh','scripts/deployment-manifest.mjs','scripts/deploy-modules.mjs'])put(path.join(repo,file),fs.readFileSync(file));
  for(const file of ['Dockerfile','.dockerignore','entrypoint.sh','get_release_url.js','docker-compose.yml','caddy/Dockerfile','caddy/Caddyfile','backup/Dockerfile','backup/backup.sh','backup/restore.sh'])put(path.join(repo,file),'fixture');
  put(path.join(repo,'modules/test-module/module.json'),JSON.stringify({id:'test-module',title:'Test',version:'1.0.0',compatibility:{minimum:'14'},esmodules:['main.mjs']}));
  put(path.join(repo,'modules/test-module/main.mjs'),'new');
  put(path.join(repo,'.env'),'must not upload');
  put(path.join(repo,'.git/HEAD'),'must not upload');
  put(path.join(repo,'data/Data/worlds/world'),'must not upload');
  put(path.join(host,'modules/test-module/obsolete'),'old');
  const preserved=['data/Data/worlds/world','data/Data/modules/manual/keep','data/module-backups/keep','.env','migration-old/keep','backup/ssh/backup_key'];
  for(const file of preserved)put(path.join(host,file),'preserved');
  put(path.join(host,'.git/HEAD'),'ref: refs/heads/main');fs.mkdirSync(path.join(host,'.git/objects'));
  const rsync=execFileSync('which',['rsync'],{encoding:'utf8'}).trim();
  const executable=(name,script)=>{const file=path.join(bin,name);put(file,'#!/usr/bin/env bash\nset -e\n'+script);fs.chmodSync(file,0o755);};
  executable('git','echo "Unexpected server Git" >&2; exit 90');
  executable('ssh',`while [[ "$1" = -* ]]; do shift 2; done
shift
export HOME="$FAKE_HOME"
if [ "$1" = 'bash -se' ]; then exec bash -se; else exec bash -c "$1"; fi
`);
  executable('rsync',`[ "\${FAIL_TRANSFER:-0}" != 1 ] || exit 23
args=()
for arg in "$@"; do args+=("\${arg/root@test:foundry/$FAKE_HOME/foundry}"); done
"$REAL_RSYNC" "\${args[@]}"
if [[ "$*" = *'.deployment-files.sha256'* && "\${CORRUPT_TRANSFER:-0}" = 1 ]]; then echo bad > "$FAKE_HOME/foundry/modules/test-module/main.mjs"; fi
`);
  executable('docker',`echo "$*" >> "$FAKE_HOME/docker.log"
case "$*" in
  *'/deploy-modules.mjs check '*) echo changed;;
  *'/deploy-modules.mjs install '*) [ "\${FAIL_INSTALL:-0}" != 1 ] || exit 42;;
  'compose images -q '*) echo existing-image;;
esac
`);
  const env={...process.env,PATH:`${bin}:${path.dirname(process.execPath)}:${process.env.PATH}`,DEPLOY_HOST:'test',DEPLOY_SSH_KEY:'fixture',DEPLOY_KNOWN_HOSTS:'fixture',DEPLOY_SHA:'a'.repeat(40),FAKE_HOME:home,REAL_RSYNC:rsync};
  const run=(extra={})=>spawnSync('bash',['scripts/publish-deployment.sh'],{cwd:repo,env:{...env,...extra},encoding:'utf8'});
  assert.notEqual(run({FAIL_TRANSFER:'1'}).status,0);assert(fs.existsSync(path.join(host,'.git')));assert(!fs.existsSync(path.join(home,'docker.log')));
  assert.notEqual(run({CORRUPT_TRANSFER:'1'}).status,0);assert(fs.existsSync(path.join(host,'.git')));assert(!fs.existsSync(path.join(home,'docker.log')));
  let result=run();assert.equal(result.status,0,result.stderr);assert(!fs.existsSync(path.join(host,'.git')));
  assert(!fs.existsSync(path.join(host,'modules/test-module/obsolete')));
  assert.equal(fs.readFileSync(path.join(host,'.deployment-revision'),'utf8').trim(),env.DEPLOY_SHA);
  for(const file of preserved)assert.equal(fs.readFileSync(path.join(host,file),'utf8'),'preserved');
  result=run();assert.equal(result.status,0,result.stderr);
  assert(!fs.readFileSync(path.join(home,'docker.log'),'utf8').includes('compose build'));
  put(path.join(repo,'get_release_url.js'),'changed build input');
  result=run();assert.equal(result.status,0,result.stderr);assert(fs.readFileSync(path.join(home,'docker.log'),'utf8').includes('compose build'));
  fs.writeFileSync(path.join(home,'docker.log'),'');
  result=run({FAIL_INSTALL:'1',DEPLOY_SHA:'b'.repeat(40)});assert.notEqual(result.status,0);
  assert(fs.readFileSync(path.join(home,'docker.log'),'utf8').trim().endsWith('compose start foundry'));
  assert.equal(fs.readFileSync(path.join(host,'.deployment-revision'),'utf8').trim(),env.DEPLOY_SHA);
  for(const file of preserved)assert.equal(fs.readFileSync(path.join(host,file),'utf8'),'preserved');
  put(path.join(host,'modules/unmanaged-source/keep'),'keep');
  result=run();assert.notEqual(result.status,0);assert.equal(fs.readFileSync(path.join(host,'modules/unmanaged-source/keep'),'utf8'),'keep');
});
