import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

function files(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not permitted: ${absolute}`);
    if (entry.isDirectory()) return files(absolute, relative);
    if (!entry.isFile()) throw new Error(`Not a regular file: ${absolute}`);
    return [relative];
  });
}

function digest(directory) {
  const hash = crypto.createHash('sha256');
  for (const relative of files(directory)) {
    hash.update(relative.replaceAll(path.sep, '/')).update('\0');
    hash.update(fs.readFileSync(path.join(directory, relative))).update('\0');
  }
  return hash.digest('hex');
}

export function validate(source) {
  const modules = fs.readdirSync(source, { withFileTypes: true }).filter(entry => entry.isDirectory());
  if (!modules.length) throw new Error('No managed modules found.');
  return modules.map(entry => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) throw new Error(`Invalid module directory: ${entry.name}`);
    const directory = path.join(source, entry.name);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'module.json'), 'utf8'));
    if (manifest.id !== entry.name) throw new Error(`Module ID must match directory: ${entry.name}`);
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error(`Invalid version: ${entry.name}`);
    if (!manifest.title || !manifest.compatibility?.minimum) throw new Error(`Incomplete manifest: ${entry.name}`);
    const packageFiles = files(directory);
    for (const resource of [...(manifest.esmodules ?? []), ...(manifest.styles ?? [])]) {
      if (typeof resource !== 'string' || !packageFiles.some(file => file.replaceAll(path.sep, '/') === resource)) {
        throw new Error(`Missing or invalid resource: ${entry.name}/${resource}`);
      }
    }
    return { id: entry.name, version: manifest.version, directory, hash: digest(directory) };
  });
}

function rejectSymlinkAncestors(directory) {
  let current = path.resolve(directory);
  while (true) {
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink target refused: ${current}`);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

export function plan(source, destination) {
  rejectSymlinkAncestors(destination);
  return validate(source).filter(module => {
    const target = path.join(destination, module.id);
    rejectSymlinkAncestors(target);
    return !fs.existsSync(target) || digest(target) !== module.hash;
  });
}

export function install(source, destination) {
  const changes = plan(source, destination);
  if (!changes.length) return [];
  // Foundry's existing Data directory must exist; never create a substitute data volume.
  const dataDirectory = path.dirname(destination);
  if (!fs.statSync(dataDirectory).isDirectory()) throw new Error('Foundry Data directory is missing.');
  const owner = fs.statSync(fs.existsSync(destination) ? destination : dataDirectory);
  fs.mkdirSync(destination, { recursive: true });
  if (process.getuid?.() === 0) fs.chownSync(destination, owner.uid, owner.gid);
  const backupRoot = path.join(path.dirname(dataDirectory), 'module-backups');
  rejectSymlinkAncestors(backupRoot);
  fs.mkdirSync(backupRoot, { recursive: true });
  const suffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const transaction = [];
  try {
    // Stage every package before replacing any installed module.
    for (const module of changes) {
      const staged = path.join(destination, `.${module.id}-${suffix}`);
      const item = { ...module, staged, target: path.join(destination, module.id), backup: path.join(backupRoot, `${module.id}-${suffix}`), saved: false, installed: false };
      transaction.push(item);
      fs.cpSync(module.directory, staged, { recursive: true, errorOnExist: true, force: false });
      if (digest(staged) !== module.hash) throw new Error(`Staging verification failed: ${module.id}`);
      if (process.getuid?.() === 0) {
        const own = directory => {
          fs.chownSync(directory, owner.uid, owner.gid);
          for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const child = path.join(directory, entry.name);
            if (entry.isDirectory()) own(child);
            else fs.chownSync(child, owner.uid, owner.gid);
          }
        };
        own(staged);
      }
    }
    for (const item of transaction) {
      if (fs.existsSync(item.target)) {
        fs.renameSync(item.target, item.backup);
        item.saved = true;
      }
      fs.renameSync(item.staged, item.target);
      item.installed = true;
    }
  } catch (error) {
    for (const item of [...transaction].reverse()) {
      if (item.installed) fs.rmSync(item.target, { recursive: true });
      if (item.saved) fs.renameSync(item.backup, item.target);
    }
    throw error;
  } finally {
    for (const item of transaction) fs.rmSync(item.staged, { recursive: true, force: true });
  }
  return changes.map(({ id, version }) => ({ id, version }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, source = 'modules', destination] = process.argv.slice(2);
  try {
    if (mode === 'validate') console.log(JSON.stringify(validate(source).map(({ id, version }) => ({ id, version }))));
    else if (mode === 'check' && destination) console.log(plan(source, destination).length ? 'changed' : 'unchanged');
    else if (mode === 'install' && destination) console.log(JSON.stringify(install(source, destination)));
    else throw new Error('Usage: deploy-modules.mjs validate SOURCE | check/install SOURCE DESTINATION');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
