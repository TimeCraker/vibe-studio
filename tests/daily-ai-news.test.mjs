import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {initEdition, statusEdition, checkEdition, validDate, preparePublish, importRecording, renderInputHash} from '../skills/daily-ai-news/scripts/edition.mjs';
import {hashFile, readJson, writeJson} from '../scripts/lib/files.mjs';
import {validatePlan} from '../skills/content-director/scripts/validate-plan.mjs';

function fixture() {
  const root=mkdtempSync(join(tmpdir(),'vibe-news-'));
  initEdition(root,'2026-10-28','https://example.invalid/fixture-only');
  const put=(n,v)=>writeJson(join(root,n),v);
  const narration='# 技术夹具\n\n## 朗读正文\n\n各位观众们，大家好。接下来是一条用于技术验证的消息。\n\n## 录音说明\n\n不是真实新闻。\n';
  writeFileSync(join(root,'narration.md'),narration);
  writeFileSync(join(root,'audio/source/manuscript.md'),narration);
  for(const n of ['original.wav','decoded.wav','asr.wav']) writeFileSync(join(root,`audio/source/${n}`),n);
  writeFileSync(join(root,'assets/icon.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');
  writeFileSync(join(root,'assets/bgm.mp3'),'fixture, not media');
  const rows=Array.from({length:15},(_,i)=>({id:`test-${i}`,name:`Fixture ${i}`,eci:100-i,icon:'icon.svg'}));
  put('ranking.json',{editionDate:'2026-10-28',queriedAt:'2026-10-28T10:00:00+08:00',entryUrl:'https://example.invalid/fixture',global:rows,domestic:rows});
  put('claims.json',['ranking','example'].map(id=>({id,text:'Technical fixture only',status:'verified',source:{url:'https://example.invalid/fixture',locator:'fixture',checkedAt:'2026-10-28'}})));
  put('selection.json',{decision:'produce',independentSearch:[{url:'https://example.invalid/fixture'}],selected:['fixture'],notes:'Technical fixture only'});
  const rec={originalSource:'audio/source/original.wav',originalSha256:hashFile(join(root,'audio/source/original.wav')),source:'audio/source/decoded.wav',sourceSha256:hashFile(join(root,'audio/source/decoded.wav')),asrSource:'audio/source/asr.wav',asrSha256:hashFile(join(root,'audio/source/asr.wav')),sourceDuration:6,manuscript:'audio/source/manuscript.md',manuscriptSha256:hashFile(join(root,'audio/source/manuscript.md'))};
  put('audio/recording.json',rec);
  put('audio/asr/raw-words.json',{originalSha256:rec.originalSha256,sourceSha256:rec.asrSha256,wordTimestamps:true,segments:[{id:0,words:[{start:.2,end:1.4,text:'各位观众们，大家好。'},{start:3.2,end:4.8,text:'接下来是一条用于技术验证的消息。'}]}]});
  put('audio/alignment.json',{review:{status:'reviewed',reviewer:'automated-fixture',notes:'Known synthetic word timestamps; not human audio acceptance'},corrections:[]});
  put('content.json',{headline:{title:'技术验证',subtitle:'不是真实新闻',logo:'assets/icon.svg',source:'fixture'},stories:[{title:'技术验证',detail:'不是真实新闻'}],scenes:[{id:'overview',title:'今日 AI 资讯',section:'今日 AI 资讯',source:'fixture',anchor:'各位观众们',claimIds:[]},{id:'example',title:'技术验证',section:'测试',source:'fixture',anchor:'接下来',claimIds:['example'],bullets:['fixture']}],music:{file:'assets/bgm.mp3',credit:'test fixture'}});
  const e=readJson(join(root,'edition.json'));e.rankingSeconds=.5;put('edition.json',e);
  return {root,put,rec,narration};
}
function align(root) {
  return spawnSync('python',[resolve('skills/daily-ai-news/scripts/align-recording.py'),'--project',root],{encoding:'utf8'});
}

test('new daily edition has no inherited stories, scores or recording; existing work is preserved',()=>{
  const root=mkdtempSync(join(tmpdir(),'vibe-news-empty-'));
  initEdition(root,'2026-10-28');
  assert.equal(statusEdition(root).stage,'research-and-script');
  assert.deepEqual(readJson(join(root,'ranking.json')).global,[]);
  assert.deepEqual(readJson(join(root,'content.json')).scenes,[]);
  writeFileSync(join(root,'narration.md'),'## 朗读正文\n各位观众们，大家好。\n## 录音说明\n技术验证');
  assert.equal(statusEdition(root).stage,'waiting-human-recording');
  writeFileSync(join(root,'narration.md'),'user-owned');
  assert.throws(()=>initEdition(root,'2026-10-29'),/never overwrites/);
  assert.equal(readFileSync(join(root,'narration.md'),'utf8'),'user-owned');
  for(const date of ['2026-02-30','2026-13-01','../2026-10-28']) assert.throws(()=>validDate(date));
});

test('no-video is distinct from failed search and a delivered script waits for human audio',()=>{
  const {root,put}=fixture();
  // No adopted recording review yet: importing alone means alignment, not production completion.
  assert.equal(statusEdition(root).stage,'align-recording');
  put('selection.json',{decision:'no-video',independentSearch:[],notes:'Fetch failed'});
  assert.equal(statusEdition(root).stage,'research-blocked');
  put('selection.json',{decision:'no-video',independentSearch:[{url:'https://example.invalid/fixture'}],notes:'Known fixture: no useful items'});
  assert.equal(statusEdition(root).stage,'no-video');
  assert.equal(checkEdition(root,'script').ok,false);
});

test('word timing preserves real silence and the original delivered manuscript',()=>{
  const {root,narration}=fixture();
  const done=align(root);assert.equal(done.status,0,done.stderr);
  const t=readJson(join(root,'timeline.json'));
  const plan=validatePlan(readJson(join(root,'storyboard.json')),root);
  assert.equal(plan.ok,true,JSON.stringify(plan.errors));
  assert.equal(t.cues.length,2);
  assert.ok((t.cues[1].from-t.cues[0].to)/60>1.7,'real 1.8-second silence must survive');
  assert.equal(readFileSync(join(root,'narration.md'),'utf8'),narration);
  assert.equal(checkEdition(root,'render').ok,true,JSON.stringify(checkEdition(root,'render')));
  writeFileSync(join(root,'audio/source/original.wav'),'changed original');
  assert.match(checkEdition(root,'render').errors.join(' '),/Recording changed/);
  assert.notEqual(align(root).status,0);
});

test('missing anchors, unreviewed ASR and old rankings cannot silently enter production',()=>{
  const {root,put}=fixture();
  const content=readJson(join(root,'content.json'));content.scenes[1].anchor='not spoken';put('content.json',content);
  assert.match(align(root).stderr,/anchor missing/);
  const review=readJson(join(root,'audio/alignment.json'));review.review.status='pending';put('audio/alignment.json',review);
  assert.match(align(root).stderr,/Review ASR/);
  const ranking=readJson(join(root,'ranking.json'));ranking.editionDate='2026-10-27';put('ranking.json',ranking);
  assert.match(checkEdition(root,'script').errors.join(' '),/another edition/);
});

test('failed alignment does not replace prior inputs; preserved manuscript is checked',()=>{
  const {root,put}=fixture();assert.equal(align(root).status,0);
  const before=hashFile(join(root,'timeline.json'));
  const content=readJson(join(root,'content.json'));content.music.file='assets/missing.mp3';put('content.json',content);
  assert.match(align(root).stderr,/Choose a local BGM/);
  assert.equal(hashFile(join(root,'timeline.json')),before);
  writeFileSync(join(root,'audio/source/manuscript.md'),'changed snapshot');
  assert.match(align(root).stderr,/manuscript snapshot changed/);
  assert.equal(hashFile(join(root,'timeline.json')),before);
});

test('real audio import preserves originals, decoded clocks and the first manuscript snapshot',()=>{
  const root=mkdtempSync(join(tmpdir(),'vibe-news-recording-'));
  initEdition(root,'2026-10-28');
  const draft='## 朗读正文\n真人录音技术夹具\n## 录音说明\n';
  writeFileSync(join(root,'narration.md'),draft);
  const input=join(root,'test-recording.wav');
  const made=spawnSync('ffmpeg',['-v','error','-f','lavfi','-i','sine=frequency=440:sample_rate=44100:duration=1.1','-y',input],{encoding:'utf8',windowsHide:true});
  assert.equal(made.status,0,made.stderr);
  const rec=importRecording(root,input);
  assert.equal(hashFile(input),rec.originalSha256);
  assert.equal(hashFile(join(root,rec.originalSource)),rec.originalSha256);
  assert.ok(Math.abs(rec.sourceDuration-1.1)<.02);
  const probe=spawnSync('ffprobe',['-v','error','-show_streams','-of','json',join(root,rec.asrSource)],{encoding:'utf8',windowsHide:true});
  assert.equal(probe.status,0,probe.stderr);
  assert.equal(JSON.parse(probe.stdout).streams[0].sample_rate,'16000');
  writeFileSync(join(root,'narration.md'),'later draft must not replace the recorded snapshot');
  assert.deepEqual(importRecording(root,input),rec);
  assert.equal(readFileSync(join(root,rec.manuscript),'utf8'),draft);
});

test('a downloaded video with an excerpt record must actually be wired into its scene',()=>{
  const {root,put}=fixture();assert.equal(align(root).status,0);
  writeFileSync(join(root,'assets/demo.mp4'),'fixture video bytes');
  const scene=readJson(join(root,'timeline.json')).scenes.at(-1);
  const clip={sceneId:'example',file:'assets/demo.mp4',sourceIn:0,sourceOut:1,timelineIn:scene.start,timelineOut:scene.start+1};
  put('assets/sources.json',[{file:clip.file,url:'https://example.invalid/official-demo',rights:'fixture only',sha256:hashFile(join(root,clip.file))}]);
  put('media-plan.json',{shots:[{sceneId:'example',videoClips:[clip]}]});
  assert.match(checkEdition(root,'render').errors.join(' '),/not wired/);
  const content=readJson(join(root,'content.json'));content.scenes[1].media={kind:'video',file:clip.file,sourceIn:0,sourceOut:1,poster:'assets/icon.svg'};put('content.json',content);
  assert.equal(checkEdition(root,'render').ok,true);
  writeFileSync(join(root,clip.file),'changed clip');
  assert.match(checkEdition(root,'render').errors.join(' '),/Video source changed/);
});

test('delivery rejects stale output inputs and exports real ASR subtitles to all platforms',()=>{
  const {root,put}=fixture();assert.equal(align(root).status,0);
  const e=readJson(join(root,'edition.json')),video=`render/daily-ai-news-${e.date}.mp4`;
  writeFileSync(join(root,video),'technical fixture; not an actual playable video');
  const sha=hashFile(join(root,video));
  const settings={path:'edition.json',hashMode:'edition-render-settings-v1'};
  put(`${video}.json`,{videoSha256:sha,fullRender:true,partialRender:false,inputs:[{path:'content.json',sha256:hashFile(join(root,'content.json'))},{...settings,sha256:renderInputHash(root,settings)}]});
  put('qa/media-report.json',{ok:true,videoSha256:sha});
  const t=readJson(join(root,'timeline.json'));
  put('variants.json',{schemaVersion:1,platforms:Object.fromEntries(['bili','douyin','xhs'].map(platform=>[platform,{title:'技术夹具',description:['仅用于离线测试'],tags:[],sceneIds:t.scenes.map(s=>s.id),format:{width:1920,height:1080,fps:60},video,cover:'assets/icon.svg'}]))});
  assert.equal(checkEdition(root,'delivery').ok,true);
  const provenance=readJson(join(root,`${video}.json`));
  provenance.toolInputs=[{path:'skills/daily-ai-news/scripts/edition.mjs',sha256:'0'.repeat(64)}];put(`${video}.json`,provenance);
  const toolDrift=checkEdition(root,'delivery');assert.equal(toolDrift.ok,true);
  assert.match(toolDrift.warnings.join(' '),/tool version differs from render provenance/);
  e.production.humanReview='accepted-in-test-fixture-only';e.status='ready-to-submit';put('edition.json',e);
  assert.equal(checkEdition(root,'delivery').ok,true,'recording a review decision must not invalidate unchanged pixels/audio');
  preparePublish(root);
  for(const platform of ['bili','douyin','xhs']) {
    assert.equal(readFileSync(join(root,`exports/${platform}/captions.srt`),'utf8'),readFileSync(join(root,'captions.srt'),'utf8'));
    assert.equal(readJson(join(root,`exports/${platform}/timeline.json`)).cues[0].start,Number((t.cues[0].from/60).toFixed(3)));
  }
  const content=readJson(join(root,'content.json'));content.headline.title='changed';put('content.json',content);
  assert.match(checkEdition(root,'delivery').errors.join(' '),/Render input changed/);
  assert.throws(()=>preparePublish(root),/Render input changed/);
});
