// Await every director frame, use project/CLI dimensions, and encode at declared fps.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { resolve, relative, isAbsolute, join, dirname, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { launchChrome, openPage, addInitScript, navigate, capturePng } from './cdp.mjs';
import { parseArgs, projectRoot } from './paths.mjs';
const args=parseArgs(process.argv.slice(2)), ROOT=projectRoot(args);
const videoPath=join(ROOT,'edit','video.json');
const base=existsSync(videoPath)?JSON.parse(readFileSync(videoPath,'utf8')):{};
if(args.variant){
  if(!/^[a-z0-9-]+$/.test(args.variant))throw new Error('Invalid variant id');
  Object.assign(base,JSON.parse(readFileSync(join(ROOT,'exports',args.variant,'render-spec.json'),'utf8')));
}
const dsf=Number(args.dsf??1);if(!Number.isFinite(dsf)||dsf<1||dsf>4)throw new Error('dsf must be between 1 and 4');
const config={...base,width:Number(args.width??base.width??1920),height:Number(args.height??base.height??1080),fps:Number(args.fps??base.fps??60)};
if(![config.width,config.height].every(n=>Number.isInteger(n)&&n>0&&n%2===0)||!Number.isFinite(config.fps)||config.fps<=0)throw new Error('Invalid video dimensions/fps');
const out=resolve(ROOT,args.out??'render/video.mp4');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
const server=createServer((req,res)=>{
  try{
    const path=resolve(ROOT,'.'+decodeURIComponent((req.url??'/').split('?')[0]));
    const rel=relative(ROOT,path);
    if(rel.startsWith('..')||isAbsolute(rel)||!existsSync(path)||!statSync(path).isFile()){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':mime[extname(path)]??'application/octet-stream','cache-control':'no-store'});res.end(readFileSync(path));
  }catch{res.writeHead(400);res.end();}
});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(Number(args.port??0),'127.0.0.1',ok);});
let browser,ff,ffDone;
try{
  browser=await launchChrome({port:Number(args.chromePort??9333)});
  async function boot(options){
    await openPage(browser.cdp,{width:options.width,height:options.height,deviceScaleFactor:dsf});
    await addInitScript(browser.cdp,`window.__CAPTURE_CONFIG=${JSON.stringify(options)};window.__DSF=${Number(args.dsf??1)};`);
    await navigate(browser.cdp,`http://127.0.0.1:${server.address().port}/edit/director.html`);
    const info=await browser.cdp.eval(`window.__boot(${JSON.stringify(options)})`,{awaitPromise:true});
    if(!Number.isInteger(info.frames)||info.frames<=0)throw new Error('Director returned invalid frames');
    return info;
  }
  if(args.cover){
    const data=JSON.parse(readFileSync(join(ROOT,'edit','covers.json'),'utf8'));
    const dir=resolve(ROOT,args.out??'render/covers');mkdirSync(dir,{recursive:true});
    for(const variant of data.variants??[]){
      if(!/^[a-zA-Z0-9_-]+$/.test(variant.name))throw new Error('Invalid cover name');
      const options={...config,width:variant.width??config.width,height:variant.height??config.height};
      await boot(options);await browser.cdp.eval(`window.__cover(${JSON.stringify(variant)})`,{awaitPromise:true});
      writeFileSync(join(dir,`${variant.name}.png`),await capturePng(browser.cdp,{clip:{x:0,y:0,width:options.width,height:options.height,scale:1/dsf}}));
    }
    console.log(JSON.stringify({ok:true,covers:data.variants.length,out:dir}));
  }else{
    const info=await boot(config);
    if(args.sample){
      mkdirSync(out,{recursive:true});
      const frames=String(args.sample).split(',').map(Number);
      for(const i of frames){
        if(!Number.isInteger(i)||i<0||i>=info.frames)throw new Error('Sample frame out of range');
        await browser.cdp.eval(`window.__frame(${i})`,{awaitPromise:true});writeFileSync(join(out,`f${String(i).padStart(5,'0')}.png`),await capturePng(browser.cdp));
      }
      const debug=await browser.cdp.eval('window.__debug()');
      if(debug.missingCount||(debug.missing?.length))throw new Error('Director has missing source frames');
      writeFileSync(join(out,'samples.json'),JSON.stringify({config,frames,debug},null,2));
    }else{
      const start=Number(args.start??0),end=args.seconds?Math.min(info.frames,start+Math.round(Number(args.seconds)*config.fps)):info.frames;
      if(!Number.isInteger(start)||start<0||start>=end)throw new Error('Invalid render range');
      const codecArgs=['-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(config.fps),'-i','-'];
      if(args.audio)codecArgs.push('-ss',String(start/config.fps),'-i',resolve(ROOT,args.audio),'-map','0:v','-map','1:a','-af','apad','-shortest','-c:a','aac','-b:a','192k');else codecArgs.push('-an');
      mkdirSync(dirname(out),{recursive:true});
      ff=spawn('ffmpeg',[...codecArgs,'-vf',`scale=${config.width}:${config.height}`,'-c:v','libx264','-preset',String(args.preset??'medium'),'-crf',String(args.crf??16),'-pix_fmt','yuv420p','-movflags','+faststart','-y',out],{stdio:['pipe','ignore','inherit']});
      ff.stdin.on('error',()=>{});
      ffDone=new Promise((ok)=>{ff.once('error',()=>ok(1));ff.once('close',ok);});
      for(let i=start;i<end;i++){
        await browser.cdp.eval(`window.__frame(${i})`,{awaitPromise:true});
        const png=await capturePng(browser.cdp,{optimizeForSpeed:true});
        await new Promise((ok,fail)=>ff.stdin.write(png,e=>e?fail(e):ok()));
      }
      ff.stdin.end();if(await ffDone!==0)throw new Error('FFmpeg render failed');
      const debug=await browser.cdp.eval('window.__debug()');
      if(debug.missingCount||debug.missing?.length)throw new Error('Director has missing source frames');
      const report={ok:true,out,...config,frames:end-start,startFrame:start,fullRender:start===0&&end===info.frames,audio:args.audio??null,debug};
      writeFileSync(`${out}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
    }
  }
}finally{
  if(ff&&ff.exitCode===null)ff.kill();browser?.kill();await new Promise(r=>server.close(r));
}
