import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const repo=resolve(project,'../..');
const r=spawnSync(process.execPath,[join(repo,'scripts/studio.mjs'),'derive','--project',project],{stdio:'inherit'});
if(r.status!==0)process.exit(r.status??1);
const timeline=JSON.parse(readFileSync(join(project,'timeline.json'),'utf8'));
const spec=JSON.parse(readFileSync(join(project,'exports/bili/render-spec.json'),'utf8'));
if(JSON.stringify(spec.sourceSceneIds)!==JSON.stringify(timeline.scenes.map(s=>s.id))||spec.seconds!==timeline.seconds)throw Error('Subtitle export requires identical full timeline; rebase cuts explicitly.');
// The shared derivative creates scene-caption cues. This episode burns sentence
// cues, so deliver the very same draft cues instead of an empty/scene-only SRT.
copyFileSync(join(project,'captions-preview.srt'),join(project,'exports/bili/captions.srt'));
const target=join(project,'exports/bili/timeline.json');const exported=JSON.parse(readFileSync(target,'utf8'));
exported.cues=timeline.cues.map(c=>({start:c.from/60,end:c.to/60,text:c.text}));
exported.subtitleTiming=timeline.timingMode;exported.voice=timeline.voice;
writeFileSync(target,JSON.stringify(exported,null,2)+'\n');
