import fs from 'node:fs';
import crypto from 'node:crypto';
import {validate} from './deploy-modules.mjs';

export const runtimeFiles=['docker-compose.yml','Dockerfile','.dockerignore','entrypoint.sh','get_release_url.js',
  'caddy/Dockerfile','caddy/Caddyfile','backup/Dockerfile','backup/backup.sh','backup/restore.sh',
  'scripts/deploy-modules.mjs','scripts/deploy-server.sh'];
const sha=process.argv[2];
if (!/^[0-9a-f]{40}$/.test(sha??'')) throw new Error('Expected tested commit SHA.');
const modules=validate('modules').sort((a,b)=>a.id<b.id?-1:1);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
const files=[...runtimeFiles,...modules.flatMap(m=>walk(`modules/${m.id}`))];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const file of files) if(!fs.lstatSync(file).isFile() || /[\n\r\\]/.test(file)) throw new Error(`Invalid deployment file: ${file}`);
fs.writeFileSync('.deployment-runtime-files',runtimeFiles.join('\n')+'\n');
fs.writeFileSync('.deployment-modules',modules.map(m=>m.id).join('\n')+'\n');
fs.writeFileSync('.deployment-files.sha256',files.map(file=>`${hash(file)}  ${file}`).join('\n')+'\n');
const buildFiles=runtimeFiles.filter(f=>f!=='docker-compose.yml' && !f.startsWith('scripts/'));
fs.writeFileSync('.deployment-build.sha256',crypto.createHash('sha256').update(buildFiles.map(f=>`${f}:${hash(f)}`).join('\n')).digest('hex')+'\n');
