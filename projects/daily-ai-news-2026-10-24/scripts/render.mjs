import {readFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');const app=join(project,'remotion-app');
const timeline=JSON.parse(readFileSync(join(project,'timeline.json'),'utf8'));
const mode=process.argv[2]||'stills';if(!['stills','sample','video','cover'].includes(mode))throw Error('Use stills/sample/video/cover');
const repo=resolve(project,'../..');const temp=join(repo,'.cache/daily-ai-news-2026-10-24-temp');mkdirSync(temp,{recursive:true});mkdirSync(join(project,'render/stills'),{recursive:true});
if(!existsSync(join(project,'audio/mix.wav')))throw Error('Run studio audio before rendering');copyFileSync(join(project,'audio/mix.wav'),join(app,'public/edition/mix.wav'));
const cli=join(app,'node_modules/@remotion/cli/remotion-cli.js');
const run=(args)=>{const r=spawnSync(process.execPath,[cli,...args],{cwd:app,env:{...process.env,TEMP:temp,TMP:temp},stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);};
const base=['remotion/index.ts','DailyAI20261024'];
if(mode==='stills')for(const s of timeline.scenes){if(process.argv[3]&&!process.argv[3].split(',').includes(s.id))continue;const second=s.end-1.2;run(['still',...base,join(project,`render/stills/${s.id}.png`),`--frame=${Math.round(second*60)}`,'--log=error']);}
if(mode==='stills'||mode==='cover')run(['still','remotion/index.ts','DailyAI20261024Cover',join(project,'render/cover.png'),'--log=error']);
if(mode==='sample'||mode==='video'){
 const visuals=join(project,`render/${mode}-visuals.mp4`);
 run(['render',...base,visuals,'--muted','--codec=h264','--crf=16','--concurrency=4','--log=error',...(mode==='sample'?['--frames=960-2399']:[])]);
 const output=join(project,`render/daily-ai-news-2026-10-24${mode==='sample'?'-sample':'-bgm-preview'}.mp4`);
 // Keep BGM automation in the explicit audio-post file, not one deeply nested
 // FFmpeg volume expression per Remotion frame on Windows.
 const mux=spawnSync('ffmpeg',['-v','error','-i',visuals,...(mode==='sample'?['-ss','16']:[]),'-i',join(project,'audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(mode==='sample'?24:timeline.seconds),'-movflags','+faststart','-y',output],{stdio:'inherit'});
 if(mux.error)throw mux.error;if(mux.status!==0)process.exit(mux.status??1);
}
