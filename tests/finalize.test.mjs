import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {cpSync,existsSync,mkdirSync,mkdtempSync,readFileSync,renameSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {archiveDelivery,finalizeDelivery,inspectFinalization,productHandoff} from '../scripts/lib/finalize.mjs';
import {hashFile,readJson,writeJson} from '../scripts/lib/files.mjs';
import {publishJobs} from '../skills/publish/templates/plan.mjs';

function git(repo,...args) {
  const result=spawnSync('git',args,{cwd:repo,encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.stderr);
  return result.stdout;
}
function fixture({stage=true,sourceOnly=false}={}) {
  const base=mkdtempSync(join(tmpdir(),'vibe-finalize-')),repo=join(base,'repo'),project=join(repo,'projects/edition');
  mkdirSync(join(project,'render'),{recursive:true});
  mkdirSync(join(project,'exports/bili'),{recursive:true});
  writeFileSync(join(repo,'.gitignore'),'.cache/\nnode_modules/\nprojects/*/render/\nprojects/*/qa/\nprojects/*/.studio/\nprojects/*/scratch/\nprojects/*/.env*\nproducts/*/media/\nproducts/*/deliverables/**/*.mp4\n');
  writeJson(join(project,'project.json'),{id:'edition',line:'b'});
  writeJson(join(project,'edition.json'),{date:'2026-10-28',production:{humanReview:'pending',publish:'not-started'}});
  writeFileSync(join(project,'narration.md'),'Original delivered script\r\n');
  writeFileSync(join(project,'voice.wav'),Buffer.from([0,255,23,42]));
  writeFileSync(join(project,'render/final.mp4'),'File-lifecycle fixture only, not an actual video');
  writeJson(join(project,'deliverables.json'),{files:['render/final.mp4']});
  writeJson(join(project,'exports/bili/form.json'),{title:'技术夹具',description:['仅验证文件生命周期'],tags:[]});
  writeJson(join(project,'publish-plan.json'),{driver:'pw',platforms:{bili:{video:'render/final.mp4',spec:'exports/bili/form.json'}}});
  git(repo,'init','-q');git(repo,'config','core.autocrlf','false');git(repo,'add','--all');
  git(repo,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');
  const archived=archiveDelivery(repo,project,{sourceOnly});
  if(stage) git(repo,'add','--',relative(repo,archived.product));
  return {base,repo,project,archive:archived.manifestPath,product:archived.product,backup:join(base,'independent/edition')};
}
const options=f=>({archive:f.archive,backup:f.backup});

test('formal archive is discoverable in products; dry-run is read-only, complete close backs up/restores then removes workspace',()=>{
  const f=fixture(),before=hashFile(join(f.product,'operations/finalization.json'));
  assert.equal(readJson(f.archive).sourceProject,'projects/edition');
  assert.equal(productHandoff(f.repo,f.project).stage,'archived-workspace-retained');
  const dry=finalizeDelivery(f.repo,f.project,{...options(f),dry:true});
  assert.equal(dry.canFinalize,true,JSON.stringify(dry.blockers));assert.equal(dry.complete,false);
  assert.equal(existsSync(f.backup),false);assert.equal(existsSync(join(f.repo,'.cache')),false);
  assert.equal(hashFile(join(f.product,'operations/finalization.json')),before);
  const closed=finalizeDelivery(f.repo,f.project,options(f));
  assert.equal(closed.complete,true,JSON.stringify(closed.blockers));assert.equal(closed.cleaned,true);
  assert.equal(existsSync(f.project),false);assert.ok(closed.restored.restored>0);
  assert.equal(hashFile(join(f.backup,'archive.json')),hashFile(f.archive));
  const metadata=readJson(closed.handoffBackup.manifest);
  assert.ok(metadata.files.some(v=>v.path==='README.md'));
  assert.ok(metadata.files.some(v=>v.path==='operations/publish-plan.json'));
  assert.equal(readFileSync(join(closed.restoredTo,'narration.md'),'utf8'),'Original delivered script\r\n');
  const handoff=productHandoff(f.repo,f.project);assert.equal(handoff.stage,'closed');assert.equal(handoff.project,f.product);
  assert.equal(readJson(join(f.product,'recipe/edition.json')).production.humanReview,'pending');
  const plan=readJson(join(f.product,'operations/publish-plan.json'));
  assert.ok(existsSync(join(f.product,plan.platforms.bili.video)));
  assert.ok(existsSync(join(f.product,plan.platforms.bili.spec)));
  assert.equal(finalizeDelivery(f.repo,f.project,options(f)).complete,true,'repeated close uses verified receipt, not a missing project');
  const receiptFile=join(f.product,'operations/finalization.json');
  writeFileSync(receiptFile,readFileSync(receiptFile,'utf8').replace(/\r?\n/g,'\r\n'));
  assert.equal(inspectFinalization(f.repo,f.project,options(f)).complete,true,'Git CRLF checkout must not invalidate an identical JSON receipt');
  const interrupted=readJson(join(f.product,'operations/finalization.json'));
  interrupted.status='ready-to-clean';interrupted.complete=false;interrupted.cleaned=false;
  writeJson(join(f.product,'operations/finalization.json'),interrupted);
  assert.equal(finalizeDelivery(f.repo,f.project,options(f)).complete,true,'recover a validated deletion interrupted before its closed receipt');
});

test('new script edits are preserved and reported instead of being deleted or rewritten into an immutable archive',()=>{
  const f=fixture(),original=hashFile(join(f.product,'recipe/narration.md'));
  writeFileSync(join(f.project,'narration.md'),'User edited this after delivery');
  const result=finalizeDelivery(f.repo,f.project,options(f));
  assert.equal(result.complete,false);assert.equal(result.cleaned,false);
  assert.match(result.blockers.join('\n'),/Unarchived or changed.*narration.md/);
  assert.match(result.blockers.join('\n'),/Uncommitted project change/);
  assert.equal(readFileSync(join(f.project,'narration.md'),'utf8'),'User edited this after delivery');
  assert.equal(hashFile(join(f.product,'recipe/narration.md')),original);
  assert.equal(productHandoff(f.repo,f.project).stage,'archived-workspace-retained');
});

test('archived publishing supports shared video/default form paths and does not require public release to archive',()=>{
  const f=fixture();
  writeJson(join(f.project,'form.json'),{title:'技术夹具',description:['验证归档后投稿入口'],tags:[]});
  writeJson(join(f.project,'publish-plan.json'),{driver:'pw',video:'render/final.mp4',platforms:{bili:{}}});
  const revision=archiveDelivery(f.repo,f.project,{id:'shared-publish'});
  const jobs=publishJobs(readJson(revision.publishPlan),revision.product);
  assert.equal(jobs.length,1);
  assert.ok(jobs[0].args.some(v=>v===join(revision.product,'recipe/form.json')));
  writeJson(join(f.project,'publish-plan.json'),{platforms:{bili:{video:'render/not-produced.mp4',spec:'form.json'}}});
  const privateDelivery=archiveDelivery(f.repo,f.project,{id:'without-publish'});
  assert.equal(privateDelivery.ok,true);assert.equal(privateDelivery.publishPlan,null);
  assert.equal(readJson(join(privateDelivery.product,'operations/publish-handoff.json')).status,'needs-materials');
});

test('untracked archive sources and new Git-ignored inputs both prevent cleanup',()=>{
  const unstaged=fixture({stage:false});
  assert.match(finalizeDelivery(unstaged.repo,unstaged.project,options(unstaged)).blockers.join('\n'),/Archive source is not staged/);
  assert.equal(existsSync(unstaged.project),true);
  const f=fixture();mkdirSync(join(f.project,'scratch'));
  writeFileSync(join(f.project,'scratch/unique.txt'),'Unique later input');
  const result=finalizeDelivery(f.repo,f.project,options(f));
  assert.match(result.blockers.join('\n'),/New unarchived input: scratch\/unique.txt/);
  assert.equal(readFileSync(join(f.project,'scratch/unique.txt'),'utf8'),'Unique later input');
});

test('unlisted QA records and video revisions are preserved; explicit hash-bound disposable output may be cleaned',()=>{
  for(const name of ['qa/new-human-review.json','render/new-r3.mp4']) {
    const f=fixture();mkdirSync(join(f.project,name.split('/')[0]),{recursive:true});writeFileSync(join(f.project,name),'Unique later work');
    const result=finalizeDelivery(f.repo,f.project,options(f));
    assert.match(result.blockers.join('\n'),new RegExp('New unarchived input: '+name.replace('.', '\\.')));
    assert.equal(readFileSync(join(f.project,name),'utf8'),'Unique later work');
  }
  const f=fixture(),file=join(f.project,'render/video-visuals.mp4');writeFileSync(file,'Reproducible intermediate');
  const config=readJson(join(f.project,'deliverables.json'));
  config.cleanup={disposable:[{path:'render/video-visuals.mp4',sha256:hashFile(file),reason:'Known silent intermediate already represented by the final output; fixture only'}]};
  writeJson(join(f.project,'deliverables.json'),config);
  git(f.repo,'add','--',relative(f.repo,join(f.project,'deliverables.json')));
  git(f.repo,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','record disposable fixture');
  const revision=archiveDelivery(f.repo,f.project,{id:'edition-r2'});
  git(f.repo,'add','--',relative(f.repo,revision.product));
  const closed=finalizeDelivery(f.repo,f.project,{archive:revision.manifestPath,backup:join(f.base,'independent/revision')});
  assert.equal(closed.complete,true,JSON.stringify(closed.blockers));assert.equal(existsSync(f.project),false);
});

test('bad primary archive, mismatched backup and an in-repository backup cannot lead to deletion',()=>{
  const badPrimary=fixture();writeFileSync(join(badPrimary.product,'media/voice.wav'),'changed');
  assert.equal(finalizeDelivery(badPrimary.repo,badPrimary.project,options(badPrimary)).complete,false);
  assert.equal(existsSync(badPrimary.project),true);
  const badBackup=fixture();cpSync(badBackup.product,badBackup.backup,{recursive:true});
  writeFileSync(join(badBackup.backup,'media/voice.wav'),'wrong bytes');
  const refused=finalizeDelivery(badBackup.repo,badBackup.project,options(badBackup));
  assert.match(refused.blockers.join('\n'),/Backup differs/);assert.equal(existsSync(badBackup.project),true);
  const inside=fixture();const result=finalizeDelivery(inside.repo,inside.project,{archive:inside.archive,backup:join(inside.repo,'backup')});
  assert.match(result.blockers.join('\n'),/outside the repository/);assert.equal(existsSync(inside.project),true);
});

test('source-only archives, private state and a running production lock remain explicit retention cases',()=>{
  const draft=fixture({sourceOnly:true});
  assert.match(finalizeDelivery(draft.repo,draft.project,options(draft)).blockers.join('\n'),/source-only draft/);
  const privateState=fixture();writeFileSync(join(privateState.project,'.env.local'),'not a credential; fixture');
  assert.match(finalizeDelivery(privateState.repo,privateState.project,options(privateState)).blockers.join('\n'),/Unarchived private state/);
  const locked=fixture();mkdirSync(join(locked.project,'.studio'));writeFileSync(join(locked.project,'.studio/run.lock'),'fixture lock');
  assert.match(finalizeDelivery(locked.repo,locked.project,options(locked)).blockers.join('\n'),/Production run lock/);
  for(const f of [draft,privateState,locked]) assert.equal(existsSync(f.project),true);
});

test('cleanup validates exact workspace boundaries and refuses redirected roots',()=>{
  const f=fixture();
  assert.throws(()=>inspectFinalization(f.repo,f.repo,options(f)),/direct child/);
  const outside=join(f.base,'outside');renameSync(f.project,outside);
  symlinkSync(outside,f.project,process.platform==='win32'?'junction':'dir');
  assert.throws(()=>finalizeDelivery(f.repo,f.project,options(f)),/Symlink|redirected|Redirected/);
  assert.equal(readFileSync(join(outside,'narration.md'),'utf8'),'Original delivered script\r\n');
});

test('shared runtimes keep their owner project; deleting a cache junction never deletes its external target',()=>{
  const owner=fixture();const runtime=join(owner.project,'remotion-app/node_modules');mkdirSync(runtime,{recursive:true});
  const borrower=join(owner.repo,'projects/borrower/remotion-app');mkdirSync(borrower,{recursive:true});
  symlinkSync(runtime,join(borrower,'node_modules'),process.platform==='win32'?'junction':'dir');
  assert.match(finalizeDelivery(owner.repo,owner.project,options(owner)).blockers.join('\n'),/Another project uses this runtime/);
  assert.equal(existsSync(owner.project),true);
  const f=fixture(),external=join(f.base,'external-runtime');mkdirSync(external);writeFileSync(join(external,'keep.txt'),'external owner');
  mkdirSync(join(f.project,'remotion-app'),{recursive:true});
  symlinkSync(external,join(f.project,'remotion-app/node_modules'),process.platform==='win32'?'junction':'dir');
  const result=finalizeDelivery(f.repo,f.project,options(f));assert.equal(result.complete,true,JSON.stringify(result.blockers));
  assert.equal(readFileSync(join(external,'keep.txt'),'utf8'),'external owner');
});

test('a removed independent backup invalidates the closed receipt without recreating the workspace',()=>{
  const f=fixture();assert.equal(finalizeDelivery(f.repo,f.project,options(f)).complete,true);
  writeFileSync(join(f.backup,'media/voice.wav'),'damaged after close');
  assert.equal(inspectFinalization(f.repo,f.project,options(f)).complete,false);
  assert.equal(productHandoff(f.repo,f.project).stage,'archive-needs-verification');
  assert.equal(existsSync(f.project),false);
});

test('handoff backup corruption is detected independently of the immutable media backup',()=>{
  const f=fixture(),closed=finalizeDelivery(f.repo,f.project,options(f));assert.equal(closed.complete,true);
  writeFileSync(join(closed.handoffBackup.manifest,'../README.md'),'Damaged handoff');
  const checked=inspectFinalization(f.repo,f.project,options(f));
  assert.equal(checked.complete,false);assert.match(checked.blockers.join('\n'),/Handoff backup mismatch/);
  assert.equal(productHandoff(f.repo,f.project).stage,'archive-needs-verification');
});

test('a real receipt export failure after deletion preserves the checkpoint and can be retried',t=>{
  const f=fixture(),rename=fs.renameSync;let injected=false;
  t.mock.method(fs,'renameSync',(from,to)=>{
    if(!injected&&!existsSync(f.project)&&to===join(f.backup,'finalization.json')) {injected=true;throw Object.assign(Error('fixture export failure'),{code:'EPERM'});}
    return rename(from,to);
  });
  syncBuiltinESMExports();
  let failed;
  try {failed=finalizeDelivery(f.repo,f.project,options(f));}
  finally {t.mock.restoreAll();syncBuiltinESMExports();}
  assert.equal(injected,true);assert.equal(existsSync(f.project),false);
  assert.equal(failed.complete,false);assert.equal(failed.cleaned,true);
  const saved=readJson(join(f.product,'operations/finalization.json'));
  assert.equal(saved.status,'closed');assert.equal(saved.receiptExportPending,true);
  assert.equal(saved.restored.ok,true);assert.ok(saved.handoffBackup.manifest);
  assert.equal(productHandoff(f.repo,f.project).stage,'cleanup-receipt-pending');
  const retried=finalizeDelivery(f.repo,f.project,options(f));
  assert.equal(retried.complete,true);assert.equal(retried.receiptExportPending,false);
  assert.equal(productHandoff(f.repo,f.project).stage,'closed');
});
