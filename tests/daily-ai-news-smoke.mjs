// Fresh-directory handoff + actual Remotion rendering from preserved old-edition inputs.
// Uses reference media explicitly as a technical fixture, not today's news or human acceptance.
import assert from 'node:assert/strict';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve, join, dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {initEdition, checkEdition, verifyDeps} from '../skills/daily-ai-news/scripts/edition.mjs';
import {hashFile, readJson, writeJson} from '../scripts/lib/files.mjs';
import {renderEdition} from '../skills/daily-ai-news/scripts/render.mjs';
const refArg=process.argv.indexOf('--reference');
if(refArg<0) throw Error('Use --reference <existing edition with local audio, fonts and official footage>; this test does not fetch or publish news');
const ref=resolve(process.argv[refArg+1]), cache=resolve('.cache');mkdirSync(cache,{recursive:true});
const root=mkdtempSync(join(cache,'daily-handoff-')), e=readJson(join(ref,'edition.json'));
initEdition(root,e.date); // Old date stays old, even though the test runs another day.
const copy=rel=>{const dst=join(root,rel);mkdirSync(dirname(dst),{recursive:true});copyFileSync(join(ref,rel),dst);};
for(const rel of ['narration.md','claims.json','ranking.json','timeline.json','storyboard.json','captions.srt','media-plan.json','assets/sources.json','audio/recording-review.json','audio/mix.wav']) copy(rel);
if(existsSync(join(ref,'selection.md'))) copy('selection.md');
writeJson(join(root,'selection.json'),{decision:'produce',independentSearch:[{kind:'technical-fixture-of-preserved-search',path:'selection.md'}],selected:['old edition as technical fixture'],notes:'No fresh news search is claimed; only preserved prior-edition inputs are exercised.'});
const r=readJson(join(root,'audio/recording-review.json')),t=readJson(join(root,'timeline.json')),ranking=readJson(join(root,'ranking.json')),plan=readJson(join(root,'media-plan.json'));
copy(r.originalSource);copy(r.source);
const clips=plan.shots.flatMap(s=>s.videoClips??[]);assert.ok(clips.length,'Reference needs at least one real official video');
const example=clips[0],poster='assets/terra-model-icon.png';
const required=new Set([poster,...[...ranking.global,...ranking.domestic].map(v=>v.icon.startsWith('assets/')?v.icon:`assets/${v.icon}`),...clips.map(v=>v.file)]);
for(const rel of required) copy(rel);
for(const name of ['sans','mono']) {const dst=join(root,`assets/fonts/${name}.ttf`);mkdirSync(dirname(dst),{recursive:true});copyFileSync(join(ref,`remotion-app/public/edition/fonts/${name}.ttf`),dst);}
const content={headline:{title:'跨会话接手 · 技术验证',subtitle:'采用旧期保存素材，只验证制作工具',logo:poster,source:'旧期技术夹具，不作今日新闻或发布'},stories:[{title:'跨会话制作验证',detail:'检查文件驱动、真实词窗和视频片段'}],scenes:t.scenes.filter(s=>!['global','domestic'].includes(s.id)).map(s=>({id:s.id,title:s.title,section:'技术验证 / 旧期材料',source:'已保留的原期来源；不代表本日新闻',lead:'本片仅用于验证新会话接手和原生 60fps 渲染。',bullets:['实际录音与词窗口','输入版本固定'],...(clips.find(c=>c.sceneId===s.id)?{media:{kind:'video',file:example.file,sourceIn:example.sourceIn,sourceOut:example.sourceOut,poster,label:'官方演示片段；旧期技术验证'}}:{})})),fonts:{sans:'assets/fonts/sans.ttf',mono:'assets/fonts/mono.ttf'}};
writeJson(join(root,'content.json'),content);
verifyDeps(root,join(ref,'remotion-app'));
assert.equal(checkEdition(root,'render').ok,true,JSON.stringify(checkEdition(root,'render')));
const run=(args)=>{const p=spawnSync(process.execPath,['skills/daily-ai-news/scripts/edition.mjs',...args,'--project',root],{cwd:resolve('.'),encoding:'utf8'});assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);};
const before=hashFile(join(ref,'narration.md'));
const handoff=run(['status']);assert.equal(handoff.date,e.date);assert.equal(handoff.stage,'produce');assert.ok(handoff.commands.job.includes('--step'));
const typecheck=spawnSync(process.execPath,[join(root,'remotion-app/node_modules/typescript/bin/tsc'),'--noEmit','--project',join(root,'remotion-app/tsconfig.json')],{encoding:'utf8'});assert.equal(typecheck.status,0,typecheck.stdout+typecheck.stderr);
await renderEdition(root,{mode:'cover'});
const start=example.timelineIn,end=Math.min(example.timelineOut,start+1.5);
const sample=await renderEdition(root,{mode:'sample',range:`${start},${end}`});
const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',join(root,sample.output)],{encoding:'utf8'});assert.equal(probe.status,0,probe.stderr);
const meta=JSON.parse(probe.stdout),v=meta.streams.find(s=>s.codec_type==='video');
assert.equal(v.width,1920);assert.equal(v.height,1080);assert.equal(v.r_frame_rate,'60/1');assert.ok(meta.streams.some(s=>s.codec_type==='audio'));assert.equal(sample.fullRender,false);assert.equal(sample.partialRender,true);
const after=run(['status']);assert.equal(after.stage,'produce','a sample is never a completed full edition');assert.equal(hashFile(join(ref,'narration.md')),before,'reference/user manuscript was not modified');
const frame=join(root,'qa/actual-video-frame.png');const shot=spawnSync('ffmpeg',['-v','error','-ss','0.6','-i',join(root,sample.output),'-frames:v','1','-y',frame],{encoding:'utf8'});assert.equal(shot.status,0,shot.stderr);
const report={ok:true,scope:'fresh-directory handoff and actual partial render only; old date/material retained; no human acceptance or upload',project:root,cover:join(root,'render/cover.png'),sample:join(root,sample.output),actualFrame:frame,fps:60,width:1920,height:1080,seconds:Number(meta.format.duration),recordingSha256:r.originalSha256,videoSha256:sample.videoSha256,referenceManuscriptUnchanged:true};
writeJson(join(root,'qa/handoff-smoke.json'),report);console.log(JSON.stringify(report,null,2));
