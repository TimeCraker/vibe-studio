import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),app=join(project,'remotion-app'),repo=resolve(project,'../..');
const mode=process.argv[2]??'stills';if(!['stills','sample','video','cover'].includes(mode))throw Error('Use stills/sample/video/cover');
const temp=join(repo,'.cache/daily-ai-news-2026-10-27-temp');mkdirSync(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;process.chdir(app);
const require=createRequire(join(app,'package.json'));const {bundle}=require('@remotion/bundler');const {openBrowser,getCompositions,renderStill,renderMedia}=require('@remotion/renderer');
const pkg=JSON.parse(readFileSync(join(app,'package.json'),'utf8'));
for(const [name,expected] of Object.entries(pkg.dependencies).filter(([n])=>n==='remotion'||n.startsWith('@remotion/'))){const actual=require(`${name}/package.json`).version;if(actual!==expected)throw Error(`Pinned dependency mismatch ${name}: ${actual}`);}
const timeline=JSON.parse(readFileSync(join(project,'timeline.json'),'utf8'));if(timeline.fps!==60)throw Error('Native 60fps required');
copyFileSync(join(project,'audio/mix.wav'),join(app,'public/edition/mix.wav'));mkdirSync(join(project,'render/stills'),{recursive:true});mkdirSync(join(project,'.studio'),{recursive:true});
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const inputFiles=['timeline.json','ranking.json','audio/mix.wav','media-plan.json','assets/sources.json','assets/terra-official-launch-1080p.mp4','remotion-app/public/edition/assets/terra-official-launch-1080p.mp4',...['Edition.tsx','Design.tsx','Scenes.tsx'].map(f=>`remotion-app/src/${f}`)];
const inputHashes=inputFiles.map(path=>({path,sha256:hash(join(project,path))}));
const assertFrozen=()=>{for(const input of inputHashes)if(hash(join(project,input.path))!==input.sha256)throw Error(`Input changed while rendering: ${input.path}; rerender instead of relabeling old media`);};
const serveUrl=await bundle({entryPoint:join(app,'remotion/index.ts'),publicDir:join(app,'public')});
const browser=await openBrowser('chrome',{logLevel:'error'});const logs=[];
const onBrowserLog=l=>{if(l.type==='error')logs.push(l.text);};
const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser,logLevel:'error',onBrowserLog});const composition=compositions.find(c=>c.id==='DailyAI20261027');
if(!composition||composition.fps!==60||composition.durationInFrames!==timeline.durationInFrames)throw Error('Composition does not match actual timeline');
writeFileSync(join(project,'.studio/compositions.json'),JSON.stringify(compositions,null,2));
try{
 if(mode==='stills'){
  const selected=process.argv[3]?.split(',');
  for(const s of timeline.scenes.filter(s=>!selected||selected.includes(s.id))){
   const frame=Math.max(Math.round(s.start*60)+20,Math.round((s.end-.85)*60));
   await renderStill({composition,serveUrl,puppeteerInstance:browser,frame,output:join(project,`render/stills/${s.id}.png`),imageFormat:'png',logLevel:'error',onBrowserLog});
   console.log(`STILL ${s.id} frame=${frame}`);
  }
 }
 if(mode==='stills'||mode==='cover'){
  const cover=compositions.find(c=>c.id==='DailyAI20261027Cover');if(!cover)throw Error('Cover missing');
  await renderStill({composition:cover,serveUrl,puppeteerInstance:browser,frame:0,output:join(project,'render/cover.png'),imageFormat:'png',logLevel:'error',onBrowserLog});
  console.log('COVER rendered');
 }
 if(mode==='sample'||mode==='video'){
  const sampleRange=mode==='sample'&&process.argv[3]?process.argv[3].split(',').map(Number):[41,65];
  const start=mode==='sample'?sampleRange[0]:0,end=mode==='sample'?sampleRange[1]:timeline.seconds;
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>timeline.seconds)throw Error('Invalid sample range');
  const visuals=join(project,`render/${mode}-visuals.mp4`);let percent=-10;
  await renderMedia({composition,serveUrl,puppeteerInstance:browser,outputLocation:visuals,codec:'h264',crf:18,x264Preset:'veryfast',pixelFormat:'yuv420p',muted:true,concurrency:6,logLevel:'error',onBrowserLog,...(mode==='sample'?{frameRange:[Math.round(start*60),Math.round(end*60)-1]}:{}),onProgress:p=>{const next=Math.floor(p.progress*10)*10;if(next>=percent+10){percent=next;console.log(`RENDER ${mode} ${next}% frames=${p.renderedFrames}`);}}});
  assertFrozen();
  const output=join(project,mode==='sample'?'render/daily-ai-news-2026-10-27-sample.mp4':'render/daily-ai-news-2026-10-27.mp4');
  const mux=spawnSync('ffmpeg',['-v','error','-i',visuals,...(start?['-ss',String(start)]:[]),'-i',join(project,'audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(end-start),'-movflags','+faststart','-y',output],{stdio:'inherit'});if(mux.error)throw mux.error;if(mux.status!==0)process.exit(mux.status??1);
  assertFrozen();
  writeFileSync(`${output}.json`,JSON.stringify({schemaVersion:1,compositionId:composition.id,width:1920,height:1080,fps:60,seconds:end-start,renderedFrameRange:[Math.round(start*60),Math.round(end*60)-1],fullRender:mode==='video',partialRender:mode==='sample',videoSha256:hash(output),inputs:inputHashes,humanReview:'pending',browserErrors:logs},null,2));
  console.log(`OUTPUT ${output}`);
 }
 if(logs.length)throw Error(`Browser errors: ${logs.join('; ')}`);
}finally{await browser.close({silent:true});}
