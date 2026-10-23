#!/usr/bin/env node
// Offline preflight, selectable fill driver, per-platform inputs and bounded execution.
import{spawn}from'node:child_process';import{readFileSync,mkdirSync,writeFileSync}from'node:fs';import{resolve,dirname,join}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{publishJobs}from'./plan.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),argv=process.argv.slice(2);
const arg=(key,fallback)=>{const i=argv.indexOf('--'+key);return i>=0&&argv[i+1]&&!argv[i+1].startsWith('--')?argv[i+1]:fallback;};
try{
 const project=resolve(arg('project',process.cwd()));
 const jobs=publishJobs(JSON.parse(readFileSync(resolve(arg('plan',join(project,'publish-plan.json'))),'utf8')),project,{only:arg('only'),driver:arg('driver')});
 if(argv.includes('--dry')){console.log(JSON.stringify({dry:true,action:'preflight-only; no browser or upload',jobs},null,2));}
 else{
  const results=await Promise.all(jobs.map(job=>new Promise(done=>{
   const child=spawn(process.execPath,[join(HERE,job.file),...job.args],{cwd:project,stdio:['ignore','pipe','pipe']});
   let timedOut=false,settled=false;
   const finish=code=>{if(settled)return;settled=true;clearTimeout(timer);done({platform:job.platform,code:timedOut?124:code,video:job.video,sha256:createHash('sha256').update(readFileSync(job.video)).digest('hex')});};
   const timer=setTimeout(()=>{timedOut=true;child.kill();},job.timeoutSeconds*1000);
   child.stdout.on('data',d=>process.stdout.write(`[${job.platform}] ${d}`));child.stderr.on('data',d=>process.stderr.write(`[${job.platform}] ${d}`));
   child.once('error',()=>finish(1));child.once('close',code=>finish(code??1));
  })));
  mkdirSync(join(project,'qa'),{recursive:true});
  const report={status:results.every(r=>r.code===0)?'filled-needs-human-check':'failed',results,published:false};
  writeFileSync(join(project,'qa/publish-run.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));process.exitCode=results.some(r=>r.code!==0)?1:0;
 }
}catch(error){console.error(error.message);process.exitCode=1;}
