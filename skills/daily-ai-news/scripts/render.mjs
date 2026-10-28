import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {checkEdition, read, renderInputHash, REPO, verifyDeps} from './edition.mjs';
import {hashFile, safePath, walk, writeJson} from '../../../scripts/lib/files.mjs';

export async function renderEdition(project, {mode = 'stills', range} = {}) {
  if (!['stills', 'cover', 'sample', 'video'].includes(mode)) throw Error('Use stills/cover/sample/video');
  const checked = checkEdition(project, 'render');
  if (!checked.ok) throw Error(checked.errors.join('\n'));
  const edition = read(project, 'edition.json'), timeline = read(project, 'timeline.json'), content = read(project, 'content.json');
  if (!content || !edition.compositionId || !edition.coverCompositionId) throw Error('Use this common renderer for initialized editions; legacy projects keep their existing render job');
  verifyDeps(project);
  const app = join(project, 'remotion-app'), publicRoot = join(app, 'public/edition');
  mkdirSync(join(publicRoot, 'fonts'), {recursive: true});
  mkdirSync(join(project, 'render/stills'), {recursive: true});
  const inputs = new Set(['edition.json', 'timeline.json', 'ranking.json', 'content.json', 'media-plan.json', 'assets/sources.json', 'audio/recording-review.json', 'captions.srt', 'audio/mix.wav', 'remotion-app/package-lock.json']);
  for (const rel of [...walk(join(app, 'src')).map(s => `remotion-app/src/${s}`), ...walk(join(app, 'remotion')).map(s => `remotion-app/remotion/${s}`)]) inputs.add(rel);
  const put = (rel, dest = rel) => {const src = safePath(project, rel), dst = safePath(publicRoot, dest); mkdirSync(join(dst, '..'), {recursive: true}); copyFileSync(src, dst); inputs.add(rel); return dst;};
  const ranking = read(project, 'ranking.json');
  for (const row of [...ranking.global, ...ranking.domestic]) put(row.icon.startsWith('assets/') ? row.icon : `assets/${row.icon}`);
  put(content.headline.logo.startsWith('assets/') ? content.headline.logo : `assets/${content.headline.logo}`);
  for (const scene of content.scenes) if (scene.media) {
    put(scene.media.file);
    if (scene.media.poster) put(scene.media.poster);
    if (scene.media.kind === 'video') {
      const result = spawnSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', safePath(project, scene.media.file)], {encoding:'utf8', windowsHide:true});
      if (result.status !== 0 || !(Number(result.stdout) + .05 >= scene.media.sourceOut)) throw Error(`Unreadable/out-of-range video: ${scene.media.file}`);
    }
  }
  for (const [key, defaultFile] of [['sans','assets/fonts/sans.ttf'], ['mono','assets/fonts/mono.ttf']]) {
    const file = content.fonts?.[key] ?? defaultFile;
    if (!existsSync(join(project, file))) throw Error(`Missing local font ${file}; freeze usable local font files before rendering (see production.md)`);
    put(file, `fonts/${key}.ttf`);
  }
  put('audio/mix.wav', 'mix.wav');
  const frozen = [...inputs].sort().map(path => {const input={path,...(path==='edition.json'?{hashMode:'edition-render-settings-v1'}:{})};return {...input,sha256:renderInputHash(project,input)};});
  const toolInputs=['skills/daily-ai-news/scripts/render.mjs','skills/daily-ai-news/scripts/edition.mjs'].map(path=>({path,sha256:hashFile(join(REPO,path))}));
  const publicFiles = walk(publicRoot).map(path => ({path, sha256: hashFile(safePath(publicRoot, path))}));
  const assertFrozen = () => {for (const input of frozen) if (renderInputHash(project,input) !== input.sha256) throw Error(`Input changed while rendering: ${input.path}`); for (const f of publicFiles) if (hashFile(safePath(publicRoot,f.path)) !== f.sha256) throw Error(`Public input changed while rendering: ${f.path}`);for(const tool of toolInputs) if(hashFile(join(REPO,tool.path))!==tool.sha256) throw Error(`Production tool changed while rendering: ${tool.path}`);};
  const temp = join(REPO, '.cache', `daily-${edition.date}-render`); mkdirSync(temp, {recursive:true}); process.env.TEMP=temp; process.env.TMP=temp;
  const require = createRequire(join(app, 'package.json'));
  const {bundle} = require('@remotion/bundler'), {openBrowser,getCompositions,renderStill,renderMedia} = require('@remotion/renderer');
  console.log('BUNDLE start');
  const serveUrl = await bundle({entryPoint:join(app,'remotion/index.ts'), rootDir:app, publicDir:join(app,'public')});
  console.log('BUNDLE ready; opening pinned Chrome runtime');
  // Remotion discovers its cached browser from cwd, not from createRequire().
  // Resolve in this app so a fresh handoff reuses the verified runtime cache.
  const previousCwd=process.cwd(); let browser;
  try {process.chdir(app); browser=await openBrowser('chrome',{logLevel:'error'});} finally {process.chdir(previousCwd);}
  console.log('BROWSER ready');
  const browserErrors = [];
  const onBrowserLog = l => {if(l.type==='error') browserErrors.push(l.text);};
  const evidence = {inputs:frozen, toolInputs, publicInputs:publicFiles, videoClips:checked.videoClips, humanReview:'pending'};
  const output = `render/daily-ai-news-${edition.date}${mode==='sample'?'-sample':''}.mp4`;
  try {
    const all = await getCompositions(serveUrl,{puppeteerInstance:browser,logLevel:'error',onBrowserLog});
    const composition = all.find(c=>c.id===edition.compositionId);
    if (!composition || composition.fps!==60 || composition.width!==1920 || composition.height!==1080 || composition.durationInFrames!==timeline.durationInFrames) throw Error('Actual Composition disagrees with timeline');
    if (mode==='stills') for(const s of timeline.scenes) {
      const frame=Math.min(Math.round(s.end*60)-1, Math.round(s.start*60)+Math.min(60, Math.floor((s.end-s.start)*30)));
      await renderStill({composition,serveUrl,puppeteerInstance:browser,frame,output:join(project,`render/stills/${s.id}.png`),imageFormat:'png',logLevel:'error',onBrowserLog});
    }
    if (mode==='cover'||mode==='stills') {
      const cover=all.find(c=>c.id===edition.coverCompositionId); if(!cover) throw Error('Cover Composition missing');
      await renderStill({composition:cover,serveUrl,puppeteerInstance:browser,frame:0,output:join(project,'render/cover.png'),imageFormat:'png',logLevel:'error',onBrowserLog});
      assertFrozen(); if(browserErrors.length) throw Error(browserErrors.join('; '));
      writeJson(join(project,`qa/${mode}-evidence.json`),evidence); return {mode,cover:'render/cover.png',...evidence};
    }
    const [start,end]=mode==='sample'?(range??`0,${Math.min(5,timeline.seconds)}`).split(',').map(Number):[0,timeline.seconds];
    if (!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>timeline.seconds) throw Error('Invalid sample range');
    const startFrame=Math.round(start*60), endFrame=Math.round(end*60)-1;
    const seconds=(endFrame-startFrame+1)/60, visuals=join(project,`render/${mode}-visuals.mp4`);
    await renderMedia({composition,serveUrl,puppeteerInstance:browser,outputLocation:visuals,codec:'h264',crf:18,x264Preset:'veryfast',pixelFormat:'yuv420p',muted:true,concurrency:4,logLevel:'error',onBrowserLog,...(mode==='sample'?{frameRange:[startFrame,endFrame]}:{}),onProgress:p=>{if(p.renderedFrames%300===0) console.log(`RENDER frames=${p.renderedFrames}`);}});
    assertFrozen();
    const mux=spawnSync('ffmpeg',['-v','error','-i',visuals,'-ss',String(startFrame/60),'-i',join(project,'audio/mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-t',String(seconds),'-movflags','+faststart','-y',join(project,output)],{stdio:'inherit',windowsHide:true});
    if(mux.error||mux.status!==0) throw Error('Audio mux failed');
    assertFrozen(); if(browserErrors.length) throw Error(browserErrors.join('; '));
    const report={schemaVersion:1,compositionId:composition.id,width:1920,height:1080,fps:60,seconds,renderedFrameRange:[startFrame,endFrame],fullRender:mode==='video',partialRender:mode==='sample',videoSha256:hashFile(join(project,output)),browserErrors,...evidence};
    writeJson(join(project,`${output}.json`),report); return {output,...report};
  } finally {await browser.close({silent:true});}
}
