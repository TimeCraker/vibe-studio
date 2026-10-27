import {existsSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');const app=join(project,'remotion-app');
// Preserve any existing installation or user-owned junction. Fresh restores
// install the exact lockfile; this task never removes/replaces an existing link.
if(!existsSync(join(app,'node_modules/remotion/package.json'))){
 if(existsSync(join(app,'node_modules')))throw Error('Incomplete existing dependencies: inspect without overwriting.');
 const r=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:app,stdio:'inherit',shell:process.platform==='win32'});
 if(r.status!==0)process.exit(r.status??1);
}
const pkg=JSON.parse(readFileSync(join(app,'package.json'),'utf8'));const versions={};
for(const [name,expected] of Object.entries(pkg.dependencies).filter(([name])=>name==='remotion'||name.startsWith('@remotion/'))){const actual=JSON.parse(readFileSync(join(app,'node_modules',name,'package.json'),'utf8')).version;if(actual!==expected)throw Error(`Pinned version mismatch: ${name}`);versions[name]=actual;}
mkdirSync(join(project,'.studio'),{recursive:true});writeFileSync(join(project,'.studio/deps.json'),JSON.stringify({versions,lockSha256:createHash('sha256').update(readFileSync(join(app,'package-lock.json'))).digest('hex'),note:'Existing runtime verified; no installation or junction replaced.'},null,2));
console.log('Pinned Remotion dependencies verified.');
