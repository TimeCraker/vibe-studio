import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(project,'../..');
const planPath=join(project,'publish-plan.json');
const previousPlan=existsSync(planPath)?JSON.parse(readFileSync(planPath,'utf8')):null;
const result=spawnSync(process.execPath,[join(repo,'scripts/studio.mjs'),'derive','--project',project],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
const read=name=>JSON.parse(readFileSync(join(project,name),'utf8'));
const timeline=read('timeline.json'),plan=read('publish-plan.json');
if(previousPlan?.platforms?.bili?.category&&plan.platforms.bili)plan.platforms.bili.category=previousPlan.platforms.bili.category;
writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
for(const platform of Object.keys(plan.platforms)){
 const spec=read(`exports/${platform}/render-spec.json`);
 if(JSON.stringify(spec.sourceSceneIds)!==JSON.stringify(timeline.scenes.map(s=>s.id))||Math.abs(spec.seconds-timeline.seconds)>.001)throw Error(`Subtitle export requires the same full timeline: ${platform}`);
 copyFileSync(join(project,'captions.srt'),join(project,`exports/${platform}/captions.srt`));
 const exported=read(`exports/${platform}/timeline.json`);exported.cues=timeline.cues.map(c=>({start:Number((c.from/timeline.fps).toFixed(3)),end:Number((c.to/timeline.fps).toFixed(3)),text:c.text}));exported.subtitleTiming=timeline.timingMode;exported.voice=timeline.voice;
 writeFileSync(join(project,`exports/${platform}/timeline.json`),JSON.stringify(exported,null,2)+'\n');
}
console.log('Prepared local submission material with identical ASR captions; no upload or publication performed.');
