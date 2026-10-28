import {existsSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';
import {archiveProject,verifyArchive,restoreArchive} from '../../../scripts/lib/archive.mjs';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(project,'../..');
// Media backup lives outside the Git checkout; never clear the working project.
const destination=resolve(process.argv[2]??join(homedir(),'Videos/vibe-studio-archive/daily-ai-news-2026-10-27-r2'));
if(existsSync(destination)&&readdirSync(destination).length)throw Error('Archive destination is not empty; preserve it and choose another revision.');
const {files}=JSON.parse((await import('node:fs')).readFileSync(join(project,'deliverables.json'),'utf8'));
const result=archiveProject(project,destination,{id:basename(destination),line:'b',scope:'source-inputs-and-deliverables',reproducibility:'inputs-archived-rerender-not-certified',humanReview:'pending'},{deliverables:files});
const verified=verifyArchive(result.manifestPath);if(!verified.ok)throw Error('Archive verification failed');
const restoredTo=join(repo,'.cache',`daily-ai-news-2026-10-27-restore-${Date.now()}`);mkdirSync(restoredTo,{recursive:true});
const restored=restoreArchive(result.manifestPath,restoredTo);if(!restored.ok)throw Error('Empty-directory restore failed');
mkdirSync(join(project,'qa'),{recursive:true});writeFileSync(join(project,'qa/archive-verification.json'),JSON.stringify({archive:result.manifestPath,verified,restoredTo,restored,rerenderCertified:false,cleaned:false},null,2));
console.log(JSON.stringify({archive:result.manifestPath,verified:verified.ok,restored:restored.restored,cleaned:false},null,2));
