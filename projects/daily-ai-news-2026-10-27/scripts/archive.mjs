import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(project,'../..');
const args=process.argv.slice(2);
if(args[0]&&!args[0].startsWith('--')) throw Error('Use --id NEW_REVISION for products/; external backup belongs to studio finalize --backup');
const result=spawnSync(process.execPath,[join(repo,'skills/daily-ai-news/scripts/edition.mjs'),'archive','--project',project,...args],{stdio:'inherit',windowsHide:true});
if(result.error) throw result.error;
process.exitCode=result.status??1;
