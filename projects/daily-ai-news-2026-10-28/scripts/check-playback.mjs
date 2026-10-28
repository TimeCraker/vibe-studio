// Local MP4 decoding/playback evidence. This does not hear audio or certify human review.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname,join,relative as pathRelative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const relative=process.argv[2]??'render/daily-ai-news-2026-10-28.mp4';
const video=resolve(root,relative);
if(pathRelative(root,video).startsWith('..')||isAbsolute(pathRelative(root,video)))throw Error('Video must be in this project');
const require=createRequire('C:/Users/TimeCraker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium}=require('playwright');
const label=relative.includes('-sample')?'sample':'final';
const folder=join(root,'qa/playback',label);mkdirSync(folder,{recursive:true});
const html=join(folder,'player.html');
writeFileSync(html,`<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f7f5ef"><video controls style="width:100vw;height:100vh" src="${pathToFileURL(video).href}"></video>`);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:960,height:540}});
 await page.goto(pathToFileURL(html).href);
 await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 const metadata=await page.$eval('video',v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
 const samples=[];
 for(const time of [1,Math.min(13,metadata.duration/2),metadata.duration-1]){
  await page.$eval('video',(v,t)=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=t;}),time);
  const filename=`seek-${time.toFixed(2)}.png`;
  await page.$eval('video',v=>v.controls=false);
  await page.screenshot({path:join(folder,filename)});
  samples.push({time,file:'qa/playback/'+label+'/'+filename});
 }
 await page.$eval('video',async v=>{v.muted=true;v.currentTime=2;await v.play();});
 await page.waitForTimeout(4000);
 const after=await page.$eval('video',v=>({time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames,paused:v.paused,error:v.error?.message??null}));
 if(after.time<5||after.paused||after.error)throw Error('Local video did not play');
 const report={ok:true,video:relative,sha256:createHash('sha256').update(readFileSync(video)).digest('hex'),metadata,samples,playback:after,scope:'Headless Chrome seek/decode and four-second muted playback; screenshots separately inspected. No subjective listening or full continuous viewing.'};
 writeFileSync(join(root,`qa/${relative.includes('-sample')?'sample-':'final-'}playback.json`),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
