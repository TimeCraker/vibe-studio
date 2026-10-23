import { createHash, randomUUID } from 'node:crypto';
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
export function hashFile(path) {
  const hash=createHash('sha256'),fd=openSync(path,'r'),buffer=Buffer.allocUnsafe(1024*1024);
  try { let n; while((n=readSync(fd,buffer,0,buffer.length,null))>0)hash.update(buffer.subarray(0,n));return hash.digest('hex'); }
  finally { closeSync(fd); }
}
export const hashValue = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  renameSync(temp, path);
}
export function inside(root, path) {
  const rel = relative(resolve(root), resolve(path));
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}
export function safePath(root, path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || /^[A-Za-z]:/.test(path) || path.includes('\\') || path.split('/').some((s) => s === '..' || s === '.')) {
    throw new Error(`Unsafe relative path: ${path}`);
  }
  const target = resolve(root, path);
  if (!inside(root, target)) throw new Error(`Path escapes root: ${path}`);
  // Check every existing ancestor: a junction/symlink can otherwise escape root.
  let current = target;
  while (inside(root, current)) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error(`Symlink not allowed: ${current}`);
    current = dirname(current);
  }
  if (existsSync(root) && realpathSync(root) !== resolve(root)) {
    // Case-insensitive Windows realpath may change drive/directory case only.
    if (realpathSync(root).toLowerCase() !== resolve(root).toLowerCase()) throw new Error(`Root is redirected: ${root}`);
  }
  return target;
}
export function walk(root, skip = () => false, prefix = '') {
  const files = [];
  for (const item of readdirSync(resolve(root, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${item.name}` : item.name;
    if (skip(rel, item)) continue;
    const path = safePath(root, rel);
    if (item.isSymbolicLink()) throw new Error(`Symlink not allowed: ${rel}`);
    if (item.isDirectory()) files.push(...walk(root, skip, rel));
    else if (item.isFile()) files.push(rel);
  }
  return files;
}
