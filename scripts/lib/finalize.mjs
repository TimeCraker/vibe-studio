import {copyFileSync,existsSync,lstatSync,mkdirSync,mkdtempSync,readdirSync,realpathSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {basename,dirname,extname,join,relative,resolve,sep} from 'node:path';
import {homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {archiveProject,restoreArchive,verifyArchive} from './archive.mjs';
import {hashFile,hashValue,inside,readJson,safePath,walk,writeJson} from './files.mjs';

const same=(a,b)=>resolve(a).toLowerCase()===resolve(b).toLowerCase();
const sameDirectory=(a,b)=>{if(same(a,b)) return true;if(!existsSync(a)||!existsSync(b)) return false;const x=statSync(a,{bigint:true}),y=statSync(b,{bigint:true});return x.ino!==0n&&x.ino===y.ino&&x.dev===y.dev;};
function physicallyInside(root,path) {
  for(let current=resolve(path);;current=dirname(current)) {if(sameDirectory(root,current)) return true;if(same(current,dirname(current))) return false;}
}
const read=(file,fallback=null)=>existsSync(file)?readJson(file):fallback;
const readReceipt=file=>{try{return read(file);}catch{return null;}};
const receiptHash=file=>{const value=readReceipt(file);return value?hashValue(value):null;};
const relativePath=(root,file)=>relative(root,file).split(sep).join('/');
const defaultBackup=product=>join(homedir(),'Videos/vibe-studio-archive',basename(product));
function productPath(repo,id) {
  if(!/^[a-z][a-z0-9-]{0,63}$/.test(id)) throw Error('Invalid archive id');
  return safePath(resolve(repo),'products/'+id);
}
function canonicalManifest(repo,file) {
  const path=resolve(file),product=dirname(path);
  if(basename(path)!=='archive.json'||!same(dirname(product),join(repo,'products'))) throw Error('Formal archive must be a direct products/<id>/archive.json entry');
  safePath(resolve(repo),relativePath(repo,path));
  return {path,product,manifest:readJson(path)};
}

export function prepareArchivedPublishPlan(product,manifest=readJson(join(product,'archive.json'))) {
  const source=manifest.files.find(f=>f.path==='publish-plan.json');
  if(!source) return null;
  const plan=readJson(safePath(product,source.stored));
  const stored=new Map(manifest.files.map(f=>[f.path,f.stored]));
  const shared={video:plan.video,cover:plan.cover},missing=[];
  for(const [platform,conf] of Object.entries(plan.platforms??{})) {
    conf.video??=shared.video;conf.cover??=shared.cover;
    conf.spec??={bili:'form.json',douyin:'douyin-form.json',xhs:'xhs-form.json'}[platform];
    for(const key of ['video','cover','spec']) {
      if(!conf[key]) continue;
      if(!stored.has(conf[key])) missing.push(conf[key]);
      else conf[key]=stored.get(conf[key]);
    }
  }
  for(const key of ['video','cover']) if(shared[key]&&stored.has(shared[key])) plan[key]=stored.get(shared[key]);
  if(missing.length) {
    writeJson(join(product,'operations/publish-handoff.json'),{status:'needs-materials',missing:[...new Set(missing)],note:'Publication is separate from production archive; prepare missing materials before uploading.'});
    return null;
  }
  const path=join(product,'operations/publish-plan.json');
  writeJson(path,plan);
  return path;
}

// The standard and daily-news CLIs use this one formal archive entrypoint.
export function archiveDelivery(repo,project,{id,sourceOnly=false}={}) {
  repo=resolve(repo);project=resolve(project);
  const info=readJson(join(project,'project.json'));
  const product=productPath(repo,id??info.id);
  const deliverables=sourceOnly?[]:readJson(join(project,'deliverables.json')).files;
  if(!sourceOnly&&(!Array.isArray(deliverables)||!deliverables.length)) throw Error('Declare final deliverables; source-only is a draft backup');
  const edition=read(join(project,'edition.json'));
  const result=archiveProject(project,product,{id:basename(product),sourceProject:relativePath(repo,project),line:info.line??'unknown',scope:sourceOnly?'draft-source-only':'source-inputs-and-deliverables',reproducibility:'inputs-archived-rerender-not-certified',humanReview:edition?.production?.humanReview??'pending'},{deliverables});
  writeFileSync(join(product,'.gitattributes'),'# Archived checksums refer to exact bytes.\narchive.json -text\nrecipe/** -text -whitespace\ndeliverables/** -text -whitespace\n');
  const links=['# '+info.id,'',sourceOnly?'草稿备份，不能按成品清场。':'制作快照已保存；当前收尾状态以 operations/finalization.json 为准。','','制作配方见 [recipe](recipe/)，逐文件清单见 [archive.json](archive.json)。','',...deliverables.filter(f=>/\.(mp4|pptx|pdf)$/i.test(f)).map(f=>'- 本地交付文件：`deliverables/'+f+'`（大文件另行备份，不随 Git 克隆）。'),'','发布和人工审阅按实际证据记录；归档和清场不自动表示已发布或人工接受。','返修恢复到新的施工目录，不修改归档快照。',''];
  writeFileSync(join(product,'README.md'),links.join('\n'));
  const publishPlan=sourceOnly?null:prepareArchivedPublishPlan(product);
  writeJson(join(product,'operations/finalization.json'),{schemaVersion:1,status:sourceOnly?'draft-archived':'archived-awaiting-finalize',sourceProject:relativePath(repo,project),archiveSha256:hashFile(result.manifestPath),cleaned:false,complete:false});
  return {...result,product,publishPlan,complete:false,cleaned:false,next:sourceOnly?'Draft backup only; restore to continue work. This is not a finished product.':'Stage the intended archive sources and metadata, then run studio finalize; publication remains independent.'};
}

function gitInfo(repo,project,manifest,product) {
  const top=spawnSync('git',['rev-parse','--show-toplevel'],{cwd:repo,encoding:'utf8',windowsHide:true});
  if(top.status!==0||!sameDirectory(top.stdout.trim(),repo)) return {available:false,blockers:['Repository identity cannot be verified; cleanup requires its Git worktree']};
  const status=spawnSync('git',['status','--porcelain=v1','-z','--untracked-files=all','--',relativePath(repo,project)],{cwd:repo,encoding:'utf8',windowsHide:true});
  if(status.status!==0) return {available:true,blockers:['Cannot inspect working-project changes']};
  const changes=status.stdout.split('\0').filter(Boolean);
  const blockers=changes.map(s=>'Uncommitted project change: '+s);
  let sourcesChecked=0;
  for(const entry of manifest.files.filter(f=>f.kind==='source')) {
    const file=relativePath(repo,join(product,entry.stored));
    const indexed=spawnSync('git',['hash-object','--no-filters',join(product,entry.stored)],{cwd:repo,encoding:'utf8',windowsHide:true});
    const staged=spawnSync('git',['rev-parse','--verify',':'+file],{cwd:repo,encoding:'utf8',windowsHide:true});
    if(indexed.status!==0||staged.status!==0||indexed.stdout.trim()!==staged.stdout.trim()) blockers.push('Archive source is not staged with its exact bytes: '+file);
    else sourcesChecked++;
  }
  for(const name of ['archive.json','README.md','.gitattributes','operations/publish-plan.json','operations/publish-handoff.json']) {
    if(!existsSync(join(product,name))) continue;
    const file=relativePath(repo,join(product,name));
    const indexed=spawnSync('git',['ls-files','--error-unmatch','--',file],{cwd:repo,encoding:'utf8',windowsHide:true});
    const changed=spawnSync('git',['diff','--quiet','--',file],{cwd:repo,windowsHide:true});
    if(indexed.status!==0||changed.status!==0) blockers.push('Archive metadata is not staged or has later changes: '+file);
  }
  return {available:true,changes,sourcesChecked,blockers};
}
function workspaceDiff(project,manifest) {
  const blockers=[],expected=new Map(manifest.files.map(f=>[f.path,f]));
  for(const entry of manifest.files) {
    const file=safePath(project,entry.path);
    if(!existsSync(file)||hashFile(file)!==entry.sha256) blockers.push('Unarchived or changed input/deliverable: '+entry.path);
  }
  const disposable=new Map();
  for(const item of read(join(project,'deliverables.json'),{}).cleanup?.disposable??[]) {
    if(!/^(qa|render)\//.test(item.path??'')||!item.reason?.trim()||! /^[a-f0-9]{64}$/.test(item.sha256??'')) {blockers.push('Invalid disposable-output decision; require exact qa/render path, hash and reason');continue;}
    const file=safePath(project,item.path);
    if(!existsSync(file)||hashFile(file)!==item.sha256) blockers.push('Disposable output changed or disappeared: '+item.path);
    else disposable.set(item.path,item);
  }
  // Archive exclusions are broader than disposable caches: QA and render can hold
  // unique user feedback or new revisions. Their unlisted files must be retained.
  const caches=new Set(['.venv','frames','out','dist','build','.studio','.cache','.baseline','.playwright-mcp']);
  const inspect=(directory,prefix='')=>{
    for(const item of readdirSync(directory,{withFileTypes:true})) {
      const path=prefix?prefix+'/'+item.name:item.name;
      if(item.name==='.git') {blockers.push('Embedded Git repository: '+path);continue;}
      if((/^\.env(?:\.|$)/.test(item.name)&&! /\.(example|template)$/.test(item.name))||/^(auth\.json|cookies?\.json|storage-state\.json|profiles?)$/i.test(item.name)) {blockers.push('Unarchived private state: '+path);continue;}
      if(['node_modules','__pycache__'].includes(item.name)||((!prefix||prefix==='remotion-app')&&caches.has(item.name))||/\.pyc$/i.test(item.name)) continue;
      if(item.isSymbolicLink()) {blockers.push('Redirected workspace path: '+path);continue;}
      if(item.isDirectory()) inspect(join(directory,item.name),path);
      else if(item.isFile()&&!expected.has(path)&&!disposable.has(path)) blockers.push('New unarchived input: '+path);
    }
  };
  inspect(project);
  if(existsSync(join(project,'.studio/run.lock'))) blockers.push('Production run lock exists; verify the run stopped first');
  return blockers;
}

function snapshotHandoff(product,backup) {
  const names=['README.md','.gitattributes'];
  if(existsSync(join(product,'operations'))) {
    for(const path of walk(join(product,'operations'))) {
      if(path==='finalization.json') continue; // The final receipt is exported separately.
      if(/(^|\/)(auth\.json|cookies?\.json|storage-state\.json)$/i.test(path)) continue;
      if(['.md','.json','.csv'].includes(extname(path).toLowerCase())) names.push('operations/'+path);
    }
  }
  const folder=mkdtempSync(join(backup,'handoff-'));
  const files=[];
  for(const path of names.filter(n=>existsSync(join(product,n)))) {
    const source=safePath(product,path),target=safePath(folder,path),sha256=hashFile(source);
    mkdirSync(dirname(target),{recursive:true});copyFileSync(source,target);
    if(hashFile(target)!==sha256||hashFile(source)!==sha256) throw Error('Handoff changed during backup: '+path);
    files.push({path,sha256});
  }
  const manifest=join(folder,'handoff.json');
  writeJson(manifest,{schemaVersion:1,scope:'README and allowed operations metadata; finalization receipt exported separately',createdAt:new Date().toISOString(),files});
  return {manifest,sha256:hashFile(manifest),files:files.length};
}
function verifyHandoff(snapshot,product) {
  if(!snapshot?.manifest||!existsSync(snapshot.manifest)||hashFile(snapshot.manifest)!==snapshot.sha256) return ['Missing or changed handoff backup manifest'];
  const root=dirname(snapshot.manifest),errors=[];
  for(const file of readJson(snapshot.manifest).files) {
    const target=safePath(root,file.path);
    if(!existsSync(target)||hashFile(target)!==file.sha256) errors.push('Handoff backup mismatch: '+file.path);
    if(product&&(!existsSync(safePath(product,file.path))||hashFile(safePath(product,file.path))!==file.sha256)) errors.push('Handoff changed before cleanup: '+file.path);
  }
  return errors;
}
function workspaceBoundary(repo,project) {
  if(!same(dirname(project),join(repo,'projects'))) throw Error('Cleanup only accepts a direct child of this repository projects/ directory');
  safePath(repo,relativePath(repo,project));
  if(existsSync(project)&&!same(realpathSync(project),project)) throw Error('Redirected project directory cannot be cleaned');
}
function dependants(repo,project) {
  const blockers=[];
  for(const item of readdirSync(join(repo,'projects'),{withFileTypes:true})) {
    if(!item.isDirectory()||same(join(repo,'projects',item.name),project)) continue;
    for(const name of ['node_modules','remotion-app/node_modules']) {
      const candidate=join(repo,'projects',item.name,name);
      if(existsSync(candidate)&&lstatSync(candidate).isSymbolicLink()) {
        const target=realpathSync(candidate);
        if(same(target,project)||inside(project,target)) blockers.push('Another project uses this runtime: '+relativePath(repo,candidate));
      }
    }
  }
  return blockers;
}
function checkBackup(repo,project,product,backup,manifestPath) {
  backup=resolve(backup);
  if(physicallyInside(repo,backup)||physicallyInside(backup,repo)||physicallyInside(project,backup)||physicallyInside(backup,project)) throw Error('Independent backup must be outside the repository and workspace');
  safePath(dirname(backup),basename(backup));
  if(existsSync(backup)) {
    if(!existsSync(join(backup,'archive.json'))) {if(readdirSync(backup).length) throw Error('Backup directory is occupied; choose an unused revision');}
    else if(hashFile(join(backup,'archive.json'))!==hashFile(manifestPath)||!verifyArchive(join(backup,'archive.json')).ok) throw Error('Backup differs or fails integrity verification; preserve it and choose a new revision');
    const exported=join(backup,'finalization.json');
    if(existsSync(exported)&&readReceipt(exported)?.archiveSha256!==hashFile(manifestPath)) throw Error('Backup finalization receipt is occupied or belongs to another archive');
  }
  return backup;
}

export function inspectFinalization(repo,project,{archive,backup}={}) {
  repo=resolve(repo);project=resolve(project);
  workspaceBoundary(repo,project);
  const {path,product,manifest}=canonicalManifest(repo,archive);
  const receiptFile=join(product,'operations/finalization.json');
  const receipt=readReceipt(receiptFile)??readReceipt(join(backup??defaultBackup(product),'finalization.json'))??{};
  const report={schemaVersion:1,sourceProject:relativePath(repo,project),product,archive:path,archiveSha256:hashFile(path),workspaceExists:existsSync(project),status:'archived-workspace-retained',cleaned:false,complete:false,blockers:[]};
  if(!existsSync(join(product,'README.md'))) report.blockers.push('Product README handoff entry is missing');
  const identity=manifest.sourceProject??('projects/'+read(join(product,'recipe/project.json'),{}).id);
  if(identity!==report.sourceProject) report.blockers.push('Archive belongs to a different working project');
  if(manifest.scope==='draft-source-only'||!manifest.files.some(f=>f.kind==='deliverable')) report.blockers.push('A source-only draft is not a finished product');
  report.verified=verifyArchive(path);
  if(!report.verified.ok) report.blockers.push(...report.verified.errors);
  try {report.backup=checkBackup(repo,project,product,backup??receipt.backup??defaultBackup(product),path);} catch(error) {report.blockers.push(error.message);}
  if(!report.workspaceExists) {
    if(!report.backup||!existsSync(join(report.backup,'archive.json'))) report.blockers.push('Completed cleanup requires its independently verified backup');
    if(['closed','ready-to-clean'].includes(receipt.status)) report.blockers.push(...verifyHandoff(receipt.handoffBackup));
    if(receipt.archiveSha256===report.archiveSha256&&!report.blockers.length) {
      const exported=report.backup&&join(report.backup,'finalization.json');
      const exportPending=receipt.receiptExportPending||!existsSync(receiptFile)||!exported||!existsSync(exported)||receiptHash(exported)!==receiptHash(receiptFile);
      if(receipt.status==='closed'&&receipt.cleaned===true) return {...report,status:exportPending?'cleanup-receipt-pending':'closed',cleaned:true,complete:!exportPending,canFinalize:exportPending,receipt};
      if(receipt.status==='ready-to-clean'&&receipt.restored?.ok) return {...report,status:'cleanup-receipt-pending',canFinalize:true,receipt};
    }
    report.blockers.push('Workspace is absent without a matching completed cleanup receipt');
    return report;
  }
  try {report.blockers.push(...workspaceDiff(project,manifest),...dependants(repo,project));} catch(error) {report.blockers.push(error.message);}
  report.git=gitInfo(repo,project,manifest,product);
  report.blockers.push(...report.git.blockers);
  report.blockers=[...new Set(report.blockers)];
  report.canFinalize=report.blockers.length===0;
  return report;
}

export function finalizeDelivery(repo,project,{archive,backup,dry=false}={}) {
  const check=inspectFinalization(repo,project,{archive,backup});
  if(dry) return {...check,dryRun:true};
  const record=report=>{const saved={...report,checkedAt:new Date().toISOString(),rerenderCertified:false};writeJson(join(check.product,'operations/finalization.json'),saved);return saved;};
  let checkpoint=check.receipt??null;
  const closeReceipt=report=>{
    const closed=record({...report,status:'closed',complete:true,cleaned:true,canFinalize:false,receiptExportPending:false,lastError:null,blockers:[]});
    checkpoint=closed;
    try {writeJson(join(check.backup,'finalization.json'),closed);return closed;}
    catch(error) {return record({...closed,complete:false,receiptExportPending:true,lastError:error.message,blockers:['Finalization receipt export failed; retry finalize: '+error.message]});}
  };
  try {
  if(check.complete||check.status==='cleanup-receipt-pending') {
    const {receipt,...current}=check;
    const handoffBackup=snapshotHandoff(check.product,check.backup);
    return closeReceipt({...receipt,...current,handoffBackup});
  }
  if(!check.canFinalize) return record(check);
  const manifest=readJson(check.archive);
  mkdirSync(check.backup,{recursive:true});
  for(const entry of manifest.files) {
    const target=safePath(check.backup,entry.stored);
    mkdirSync(dirname(target),{recursive:true});
    if(!existsSync(target)) copyFileSync(safePath(check.product,entry.stored),target);
  }
  if(!existsSync(join(check.backup,'archive.json'))) copyFileSync(check.archive,join(check.backup,'archive.json'));
  const backupVerified=verifyArchive(join(check.backup,'archive.json'));
  if(!backupVerified.ok) return record({...check,blockers:backupVerified.errors,canFinalize:false});
  mkdirSync(join(resolve(repo),'.cache'),{recursive:true});
  const restoredTo=mkdtempSync(join(resolve(repo),'.cache/finalize-restore-'));
  const restored=restoreArchive(check.archive,restoredTo);
  if(!restored.ok) return record({...check,blockers:['Restore failed'],canFinalize:false});
  // Recheck immediately before the only destructive operation, after backup/restore.
  const last=inspectFinalization(repo,project,{archive:check.archive,backup:check.backup});
  if(!last.canFinalize) return record({...last,restoredTo,restored});
  const handoffBackup=snapshotHandoff(check.product,check.backup);
  const metadataErrors=verifyHandoff(handoffBackup,check.product);
  if(metadataErrors.length) return record({...last,blockers:metadataErrors,canFinalize:false});
  const prepared=record({...last,status:'ready-to-clean',backupVerified,restoredTo,restored,handoffBackup});
  checkpoint=prepared;
  writeJson(join(check.backup,'finalization.json'),prepared);
  const beforeRemoval=inspectFinalization(repo,project,{archive:check.archive,backup:check.backup});
  if(!beforeRemoval.canFinalize) return record({...beforeRemoval,restoredTo,restored,handoffBackup});
  workspaceBoundary(resolve(repo),resolve(project));
  rmSync(resolve(project),{recursive:true});
  return closeReceipt({...prepared,workspaceExists:false,closedAt:new Date().toISOString()});
  } catch(error) {
    // Preserve the latest validated checkpoint even if deletion already succeeded.
    const preserved=checkpoint??check;
    return record({...preserved,complete:false,canFinalize:false,workspaceExists:existsSync(project),lastError:error.message,blockers:[error.message],...(preserved.status==='closed'?{receiptExportPending:true}:{})});
  }
}

export function findProduct(repo,project) {
  repo=resolve(repo);project=resolve(project);
  if(!same(dirname(project),join(repo,'projects'))||!existsSync(join(repo,'products'))) return null;
  const matches=[];
  for(const item of readdirSync(join(repo,'products'),{withFileTypes:true})) {
    if(!item.isDirectory()||item.isSymbolicLink()) continue;
    const product=join(repo,'products',item.name),file=join(product,'archive.json');
    if(!existsSync(file)) continue;
    const manifest=readJson(file),info=read(join(product,'recipe/project.json'),{});
    if(manifest.scope==='draft-source-only'||!manifest.files.some(f=>f.kind==='deliverable')) continue;
    if((manifest.sourceProject??'projects/'+info.id)!==relativePath(repo,project)) continue;
    matches.push({product,archive:file,manifest,edition:read(join(product,'recipe/edition.json')),receipt:readReceipt(join(product,'operations/finalization.json'))});
  }
  return matches.sort((a,b)=>String(b.manifest.createdAt??'').localeCompare(String(a.manifest.createdAt??'')))[0]??null;
}

export function productHandoff(repo,project,{archive:explicitArchive}={}) {
  let found;
  if(explicitArchive) {
    const {product,path,manifest}=canonicalManifest(repo,explicitArchive);
    found={product,archive:path,manifest,receipt:readReceipt(join(product,'operations/finalization.json')),edition:read(join(product,'recipe/edition.json'))};
  } else found=findProduct(repo,project);
  if(!found) return null;
  const {product,archive,edition}=found;
  const receipt=found.receipt??readReceipt(join(defaultBackup(product),'finalization.json'));
  const workspaceExists=existsSync(project),manifestMatches=receipt?.archiveSha256===hashFile(archive);
  const issues=[];
  if(!existsSync(join(product,'README.md'))) issues.push('缺少作品根 README 交付入口。');
  const verified=verifyArchive(archive);
  if(!verified.ok) issues.push(...verified.errors);
  if(receipt?.status==='closed') {
    const backupManifest=receipt.backup&&join(receipt.backup,'archive.json');
    if(!backupManifest||!existsSync(backupManifest)||hashFile(backupManifest)!==hashFile(archive)||!verifyArchive(backupManifest).ok) issues.push('独立备份缺失或与归档不一致，需修复。');
    issues.push(...verifyHandoff(receipt.handoffBackup));
  }
  const exported=receipt?.backup&&join(receipt.backup,'finalization.json');
  const exportPending=receipt?.receiptExportPending||(receipt?.status==='closed'&&(!exported||!existsSync(exported)||!existsSync(join(product,'operations/finalization.json'))||receiptHash(exported)!==receiptHash(join(product,'operations/finalization.json'))));
  const pendingReceipt=!workspaceExists&&manifestMatches&&(receipt?.status==='ready-to-clean'||(receipt?.status==='closed'&&exportPending));
  const closed=!workspaceExists&&receipt?.status==='closed'&&receipt.cleaned&&manifestMatches&&!issues.length&&!pendingReceipt;
  const blockers=issues.length?issues:manifestMatches?(receipt.blockers?.length?receipt.blockers:closed?[]:['已归档，尚未完成统一收尾检查。']):['尚无匹配的统一收尾记录；需检查工作区差异、备份与试恢复。'];
  return {project:product,workspace:resolve(project),date:edition?.date,stage:issues.length?'archive-needs-verification':closed?'closed':pendingReceipt?'cleanup-receipt-pending':'archived-workspace-retained',primaryEntry:existsSync(join(product,'README.md'))?join(product,'README.md'):archive,archive,verified,cleaned:!workspaceExists&&manifestMatches&&!!receipt?.restored?.ok,complete:!!closed,next:closed?'从 products 的作品 README 继续投稿/复盘；返修时恢复到新的施工目录。':'以 products 为交付入口；执行 finalize --dry 查看保留原因，满足条件后收尾，勿盲目重跑制作。',blockers,commands:{verifyArchive:`node scripts/studio.mjs verify-archive --archive "${archive}"`,finalize:`node scripts/studio.mjs finalize --project "${resolve(project)}" --archive "${archive}" --dry`,...(existsSync(join(product,'operations/publish-plan.json'))?{publishPreflight:`node skills/publish/templates/run.mjs --project "${product}" --plan "${join(product,'operations/publish-plan.json')}" --dry`}:{})},read:['README.md','archive.json','operations/finalization.json','operations/archive-placement.json','operations/publish-plan.json','deliverables/qa/multiplatform-handoff.json'].filter(p=>existsSync(join(product,p))),verification:'Archive file integrity is checked; human review and publication remain separate.'};
}
