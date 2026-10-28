#!/usr/bin/env node
import {copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync} from 'node:fs';
import {basename, dirname, extname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {hashFile, hashValue, readJson, safePath, writeJson} from '../../../scripts/lib/files.mjs';
import {derive} from '../../publish/scripts/derive.mjs';
import {archiveProject, restoreArchive, verifyArchive} from '../../../scripts/lib/archive.mjs';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const HERE = dirname(fileURLToPath(import.meta.url));
export const read = (root, name, fallback = null) => existsSync(join(root, name)) ? readJson(safePath(root, name)) : fallback;
export function renderInputHash(root, input) {
  if (input.hashMode === 'edition-render-settings-v1') {
    const {status, production, ...settings} = readJson(safePath(root, input.path));
    return hashValue(settings); // Status and human-review records do not change pixels/audio.
  }
  return hashFile(safePath(root, input.path));
}
export const today = () => new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
export function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw Error('Expected a real YYYY-MM-DD edition date');
  return date;
}
const run = (exe, args, cwd) => {
  const r = spawnSync(exe, args, {cwd, encoding: 'utf8', timeout: 600000, maxBuffer: 16 * 1024 * 1024, windowsHide: true});
  if (r.error || r.status !== 0) throw Error(`${exe} failed: ${r.error?.message ?? r.stderr?.slice(-1800)}`);
  return r.stdout;
};
export function initEdition(root, date, source) {
  validDate(date);
  if (existsSync(root) && readdirSync(root).length) throw Error('Existing edition: run status --project instead; init never overwrites');
  mkdirSync(root, {recursive: true});
  for (const dir of ['assets', 'evidence', 'audio/source', 'audio/asr', 'render', 'qa', 'remotion-app/remotion', 'remotion-app/src']) mkdirSync(join(root, dir), {recursive: true});
  const id = `daily-ai-news-${date}`;
  writeJson(join(root, 'project.json'), {schemaVersion: 1, id, line: 'b', targets: ['bili', 'douyin', 'xhs']});
  writeJson(join(root, 'edition.json'), {schemaVersion: 1, date, status: 'research', sourceDocument: source ?? null, fps: 60, width: 1920, height: 1080, compositionId: 'DailyAI', coverCompositionId: 'DailyAICover', narration: 'human', narrationFile: 'narration.md', rankingSeconds: 7, production: {humanRecording: 'pending', humanReview: 'pending', publish: 'not-started'}});
  writeJson(join(root, 'selection.json'), {decision: 'pending', independentSearch: [], documentSupplement: [], selected: [], rejected: [], notes: ''});
  writeJson(join(root, 'claims.json'), []);
  writeJson(join(root, 'ranking.json'), {editionDate: date, metric: 'ECI', queriedAt: null, sourceGeneratedAt: null, entryUrl: 'https://www.bilibili.com/toy/ai-model-world', global: [], domestic: []});
  writeJson(join(root, 'assets/sources.json'), []);
  writeJson(join(root, 'content.json'), {headline: {title: '', subtitle: '', logo: '', source: ''}, stories: [], scenes: [], fonts: {sans:'assets/fonts/sans.ttf', mono:'assets/fonts/mono.ttf'}, music: {file: '', credit: ''}});
  writeJson(join(root, 'audio/alignment.json'), {review: {status: 'pending', reviewer: '', notes: ''}, corrections: [], sourceIn: null, sourceOut: null});
  writeFileSync(join(root, 'narration.md'), '# 口播稿\n\n## 朗读正文\n\n## 录音说明\n\n先完成选题核查并交稿，用户从资讯总览开始自然朗读，榜单只放音乐。\n', 'utf8');
  writeFileSync(join(root, 'README.md'), `# 每日 AI 资讯 · ${date}\n\n交接入口：\`node skills/daily-ai-news/scripts/edition.mjs status --project projects/${id}\`。当前事实以该命令检查的文件为准。\n\n制作方法见 [运行手册](../../skills/daily-ai-news/references/production.md)。本期独立检索与文档补充写入 selection.json；未决定出片前不制作空视频。\n`, 'utf8');
  const appTemplate = join(REPO, 'skills/video-motion/templates/remotion-app');
  for (const name of ['package.json', 'package-lock.json', 'tsconfig.json']) copyFileSync(join(appTemplate, name), join(root, 'remotion-app', name));
  cpSync(join(HERE, '../templates/remotion'), join(root, 'remotion-app'), {recursive: true});
  const steps = [
    {id: 'deps', args: ['deps'], inputs: ['remotion-app/package.json', 'remotion-app/package-lock.json'], outputs: ['.studio/deps.json']},
    {id: 'plan', command: ['node', '{repo}/skills/content-director/scripts/validate-plan.mjs', '{project}'], inputs: ['storyboard.json'], outputs: []},
    {id: 'voice', command: ['node', '{repo}/scripts/studio.mjs', 'audio', '--project', '{project}', '--config', 'audio-voice.json', '--out', 'audio/voice-clean.wav'], inputs: ['audio-voice.json', 'audio/source'], outputs: ['audio/voice-clean.wav', 'audio/voice-clean.wav.json']},
    {id: 'audio', command: ['node', '{repo}/scripts/studio.mjs', 'audio', '--project', '{project}'], inputs: ['audio.json', 'audio/voice-clean.wav', 'assets'], outputs: ['audio/mix.wav', 'audio/mix.wav.json']},
    {id: 'stills', args: ['render', '--mode', 'stills'], inputs: ['timeline.json', 'ranking.json', 'content.json', 'remotion-app/src', 'assets', 'audio/mix.wav'], outputs: ['render/stills', 'render/cover.png'], timeoutSeconds: 900},
    {id: 'render', args: ['render', '--mode', 'video'], inputs: ['timeline.json', 'ranking.json', 'content.json', 'remotion-app/src', 'assets', 'audio/mix.wav', 'media-plan.json'], outputs: [`render/${id}.mp4`, `render/${id}.mp4.json`], timeoutSeconds: 3600},
    {id: 'qc', command: ['node', '{repo}/scripts/studio.mjs', 'qc', '--project', '{project}', '--video', `render/${id}.mp4`, '--srt', 'captions.srt', '--require-audio'], inputs: [`render/${id}.mp4`, 'captions.srt', 'qc.json'], outputs: ['qa/media-report.json'], timeoutSeconds: 900},
    {id: 'publish-materials', args: ['publish-materials'], inputs: ['variants.json', 'storyboard.json', 'timeline.json', 'captions.srt'], outputs: ['publish-plan.json'], timeoutSeconds: 180},
  ].map(({args, ...s}) => ({...s, command: s.command ?? ['node', '{repo}/skills/daily-ai-news/scripts/edition.mjs', ...args, '--project', '{project}']}));
  writeJson(join(root, 'job.json'), {schemaVersion: 1, steps});
  return statusEdition(root);
}

export function checkEdition(root, phase = 'render') {
  if (!['script', 'render', 'delivery'].includes(phase)) throw Error('phase must be script/render/delivery');
  const errors = [], warnings = [], media = [];
  const exists = name => existsSync(safePath(root, name));
  const need = name => { if (!exists(name)) errors.push(`Missing ${name}`); };
  const e = read(root, 'edition.json', {}), ranking = read(root, 'ranking.json', {});
  try { validDate(e.date); } catch { errors.push('edition.json needs a valid date'); }
  if (e.fps !== 60 || e.width !== 1920 || e.height !== 1080) errors.push('Expected native 1920x1080 / 60fps');
  for (const kind of ['global', 'domestic']) {
    const rows = ranking[kind];
    if (!Array.isArray(rows) || rows.length !== 15) errors.push(`${kind} must contain actual TOP15`);
    else {
      if (new Set(rows.map(r => r.id)).size !== 15) errors.push(`Duplicate ${kind} model id`);
      rows.forEach((r, i) => {
        if (!r.id || !r.name || !Number.isFinite(r.eci)) errors.push(`Invalid ${kind} row ${i + 1}`);
        if (i && r.eci > rows[i - 1].eci) errors.push(`${kind} order differs from descending source scores`);
        if (!r.icon) errors.push(`Missing official icon: ${r.name}`);
        else need(r.icon.startsWith('assets/') ? r.icon : `assets/${r.icon}`);
      });
    }
  }
  if (ranking.editionDate !== e.date) errors.push('Ranking belongs to another edition');
  if (!ranking.queriedAt || !Number.isFinite(Date.parse(ranking.queriedAt))) errors.push('Missing actual ranking query time');
  if (!ranking.entryUrl && !ranking.sourceUrl) warnings.push('Record ranking source entry in ranking.json');
  need('narration.md'); need('claims.json');
  if (exists('narration.md') && !readFileSync(join(root, 'narration.md'), 'utf8').split('## 朗读正文')[1]?.split('## 录音说明')[0].trim()) errors.push('Write the actual readable narration body before script handoff');
  const selection = read(root, 'selection.json');
  if (selection && (selection.decision !== 'produce' || !selection.independentSearch?.length || !selection.selected?.length)) errors.push('Record independent search, actual selected items and produce decision first');
  const claims = read(root, 'claims.json', []);
  if (!Array.isArray(claims) || !claims.length || claims.some(c => c.status !== 'verified')) errors.push('claims.json must contain verified source-backed claims');
  else if (claims.some(c => !c.source?.url && !c.source?.path)) errors.push('Verified claims need source URL/path locators');
  if (phase === 'script') return {ok: !errors.length, phase, errors, warnings};
  for (const name of ['timeline.json', 'audio/recording-review.json', 'media-plan.json', 'assets/sources.json']) need(name);
  const t = read(root, 'timeline.json', {}), recording = read(root, 'audio/recording-review.json', {});
  if (t.date !== e.date || t.fps !== 60 || t.width !== 1920 || t.height !== 1080 || !Number.isInteger(t.durationInFrames) || Math.abs(t.seconds * 60 - t.durationInFrames) > .001) errors.push('Timeline date/format/frame count mismatch');
  for (const [key, hashKey] of [['originalSource', 'originalSha256'], ['source', 'sourceSha256']]) {
    if (!recording[key]) errors.push(`Recording review missing ${key}`);
    else if (!exists(recording[key]) || hashFile(safePath(root, recording[key])) !== recording[hashKey]) errors.push(`Recording changed: ${recording[key]}`);
  }
  if (!/word|词/.test(t.timingMode ?? recording.timing ?? '')) errors.push('Actual word timing is required');
  if (t.recordingSha256 !== recording.originalSha256) errors.push('Timeline belongs to a different recording');
  if (!Array.isArray(t.scenes) || !t.scenes.length || t.scenes[0]?.id !== 'global' || t.scenes[1]?.id !== 'domestic') errors.push('Timeline must start with global/domestic rankings');
  const ids = new Set(); let previous = 0;
  for (const s of t.scenes ?? []) {
    if (ids.has(s.id) || !Number.isFinite(s.start) || !Number.isFinite(s.end) || s.end <= s.start || Math.abs(s.start - previous) > 1/60 + .001) errors.push(`Invalid scene boundary: ${s.id}`);
    previous = s.end; ids.add(s.id);
  }
  if (Math.abs(previous - t.seconds) > 1/60 + .001) errors.push('Scenes do not cover the timeline');
  previous = 0;
  if (!Array.isArray(t.cues) || !t.cues.length) errors.push('No real-recording subtitles');
  for (const c of t.cues ?? []) {
    const s = t.scenes?.find(s => s.id === c.scene);
    if (!s || !c.text || !Number.isInteger(c.from) || !Number.isInteger(c.to) || c.from < previous || c.to <= c.from || c.from < s.start * 60 - 1 || c.to > s.end * 60 + 1) errors.push(`Invalid subtitle: ${c.id}`);
    previous = c.to;
  }
  const sources = read(root, 'assets/sources.json', []), content = read(root, 'content.json');
  const sourceList = Array.isArray(sources) ? sources : sources.sources ?? [];
  const declared = read(root, 'media-plan.json', {}).shots ?? [];
  const clips = declared.flatMap(s => s.videoClips ?? []);
  for (const clip of clips) {
    const scene = t.scenes?.find(s => s.id === clip.sceneId);
    const record = sourceList.find(s => s.file === clip.file);
    need(clip.file);
    if (!record || !(record.url || record.sourcePage || record.sourceUrl) || !record.rights) errors.push(`Missing video source/use record: ${clip.file}`);
    if (!scene || !Number.isFinite(clip.sourceIn) || clip.sourceIn < 0 || !(clip.sourceOut > clip.sourceIn) || clip.timelineIn < scene.start - .02 || clip.timelineOut > scene.end + .02) errors.push(`Invalid video excerpt: ${clip.file}`);
    if (record?.sha256 && exists(clip.file) && hashFile(safePath(root, clip.file)) !== record.sha256) errors.push(`Video source changed: ${clip.file}`);
    if (content) {
      const used = content.scenes?.find(s => s.id === clip.sceneId)?.media;
      if (used?.kind !== 'video' || used.file !== clip.file || used.sourceIn !== clip.sourceIn || used.sourceOut !== clip.sourceOut) errors.push(`Video found but not wired into scene: ${clip.sceneId}`);
    } else warnings.push(`Legacy JSX video requires actual-frame review: ${clip.sceneId}`);
    media.push({sceneId: clip.sceneId, file: clip.file, sourceIn: clip.sourceIn, sourceOut: clip.sourceOut, timelineIn: clip.timelineIn, timelineOut: clip.timelineOut});
  }
  if (content) {
    for (const s of content.scenes ?? []) {
      if (!ids.has(s.id)) errors.push(`Content scene missing from timeline: ${s.id}`);
      if (!s.title || !s.section) errors.push(`Scene needs a clear title and section: ${s.id}`);
      if (s.media) {
        need(s.media.file);
        if (s.media.kind === 'video' && !clips.some(c => c.sceneId === s.id && c.file === s.media.file)) errors.push(`Video scene missing excerpt record: ${s.id}`);
      }
    }
    if (t.scenes?.some(s => !['global', 'domestic'].includes(s.id) && !content.scenes?.some(c => c.id === s.id))) errors.push('A timeline scene has no content');
  }
  if (!clips.length) warnings.push('No video excerpt selected; explain actual search/fallbacks rather than claim footage included');
  if (phase === 'delivery') {
    need('captions.srt');
    const output = e.videoFile ?? `render/daily-ai-news-${e.date}.mp4`;
    need(output); need(`${output}.json`);
    const report = read(root, `${output}.json`, {}), qc = read(root, 'qa/media-report.json', {});
    const sha = exists(output) ? hashFile(safePath(root, output)) : null;
    if (report.videoSha256 !== sha || !report.fullRender || report.partialRender) errors.push('Missing/stale full render evidence');
    for (const input of report.inputs ?? []) if (!exists(input.path) || renderInputHash(root, input) !== input.sha256) errors.push(`Render input changed: ${input.path}`);
    for (const tool of report.toolInputs ?? []) if (!existsSync(safePath(REPO, tool.path)) || hashFile(safePath(REPO, tool.path)) !== tool.sha256) errors.push(`Production tool changed: ${tool.path}`);
    if (!qc.ok || qc.videoSha256 !== sha) errors.push('Missing/stale technical QC for the delivered file');
    warnings.push('Technical checks do not certify human audiovisual acceptance or publication');
  }
  return {ok: !errors.length, phase, errors: [...new Set(errors)], warnings: [...new Set(warnings)], videoClips: media};
}

export function statusEdition(root) {
  const e = read(root, 'edition.json');
  if (!e) throw Error('No edition.json: specify an existing edition or init --date');
  const selection = read(root, 'selection.json'), r = read(root, 'audio/recording-review.json');
  const output = e.videoFile ?? `render/daily-ai-news-${e.date}.mp4`;
  const has = f => existsSync(join(root, f));
  let stage, next;
  if (selection?.decision === 'no-video' && selection.independentSearch?.length && selection.notes) {stage = 'no-video'; next = '本期不出片；保留筛选依据，不制作空视频。';}
  else if (selection?.decision === 'blocked' || selection?.decision === 'no-video') {stage = 'research-blocked'; next = '记录检索/核实缺口；检索失败不能当成今日没有合适新闻。';}
  else if (!has('narration.md') || !readFileSync(join(root, 'narration.md'), 'utf8').split('## 朗读正文')[1]?.split('## 录音说明')[0].trim()) {stage = 'research-and-script'; next = '先独立检索，再读参考文档；核查选题、取得榜单、编写并交付朗读正文。';}
  else if (!read(root, 'audio/recording.json') && !r) {stage = 'waiting-human-recording'; next = '向用户贴完整口播稿；准备素材，等待录音，不先导出整片。';}
  else if (!r || (read(root, 'audio/recording.json')?.originalSha256 && read(root, 'audio/recording.json').originalSha256 !== r.originalSha256)) {stage = 'align-recording'; next = '词级转写，核对实际用词、事实差异和镜头锚点，再运行 align。';}
  else if (!has('timeline.json')) {stage = 'build-inputs'; next = '运行 align 生成实际时间线，再设计/检查画面。';}
  else if (!has(output)) {stage = 'produce'; next = 'check --phase render；运行 job 的 voice/audio/stills，审查代表片段后 render/qc。';}
  else {const report = checkEdition(root, 'delivery'); stage = report.ok ? 'review-and-submission' : 'check-or-repair'; next = report.ok ? '检查实际成片；按授权准备三平台物料/上传；登录和最终发布由用户完成，保全并验证归档。' : report.errors.join('; ');}
  return {project: resolve(root), date: e.date, stage, next, sourceDocument: e.sourceDocument ?? null, commands: {check: `node skills/daily-ai-news/scripts/edition.mjs check --project "${root}" --phase render`, job: `node scripts/studio.mjs run --project "${root}" --step <ID>`, uploadPreflight: `node skills/publish/templates/run.mjs --project "${root}" --dry`}, read: ['README.md', 'edition.json', 'selection.json', 'selection.md', 'narration.md', 'audio/recording.json', 'audio/recording-review.json', 'timeline.json', 'media-plan.json', 'assets/sources.json', 'job.json'].filter(has), publish: read(root, 'qa/multiplatform-handoff.json') ?? e.production?.publish ?? 'unknown', humanReview: e.production?.humanReview ?? 'pending', archive: read(root, 'qa/archive-verification.json')?.archive ?? 'not-verified', note: 'This is file evidence, not a claim of full human review or platform publication.'};
}

export function importRecording(root, file) {
  const e = read(root, 'edition.json'); if (!e) throw Error('Missing edition.json');
  if (!statSync(file).isFile()) throw Error('Recording must be a local file');
  const hash = hashFile(file), ext = extname(file).toLowerCase();
  if (!['.m4a', '.mp3', '.wav', '.flac', '.mp4', '.aac', '.ogg'].includes(ext)) throw Error('Unsupported recording extension');
  const originalSource = `audio/source/narration-original-${hash.slice(0, 12)}${ext}`;
  mkdirSync(join(root, 'audio/source'), {recursive: true});
  const target = safePath(root, originalSource);
  if (existsSync(target) && hashFile(target) !== hash) throw Error('Preserved recording collision');
  if (!existsSync(target)) copyFileSync(file, target);
  const draft = safePath(root, e.narrationFile ?? 'narration.md');
  const manuscript = `audio/source/manuscript-${hash.slice(0,12)}.md`;
  if (!existsSync(join(root, manuscript))) copyFileSync(draft, join(root, manuscript));
  const decoded = `audio/source/narration-decoded-${hash.slice(0,12)}.wav`, asr = `audio/source/narration-asr-${hash.slice(0,12)}.wav`;
  if (!existsSync(join(root, decoded))) run('ffmpeg', ['-v', 'warning', '-i', target, '-vn', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', '-n', join(root, decoded)], root);
  if (!existsSync(join(root, asr))) run('ffmpeg', ['-v', 'error', '-i', join(root, decoded), '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', '-n', join(root, asr)], root);
  const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', join(root, decoded)], root).trim());
  if (!(duration > 0)) throw Error('Decoded recording has no duration');
  const data = {originalSource, originalSha256: hash, source: decoded, sourceSha256: hashFile(join(root, decoded)), asrSource: asr, asrSha256: hashFile(join(root, asr)), sourceDuration: duration, manuscript, manuscriptSha256: hashFile(join(root, manuscript)), clock: 'decoded PCM; original unchanged; no voice speed change'};
  writeJson(join(root, 'audio/recording.json'), data); return data;
}

export function verifyDeps(root, runtime) {
  const app = join(root, 'remotion-app'), pkg = readJson(join(app, 'package.json'));
  const verify = folder => Object.fromEntries(Object.entries(pkg.dependencies).filter(([n]) => n === 'remotion' || n.startsWith('@remotion/')).map(([n, expected]) => {const actual = readJson(join(folder, n, 'package.json')).version; if (actual !== expected) throw Error(`Pinned dependency mismatch: ${n}`); return [n, actual];}));
  const folder = join(app, 'node_modules');
  if (!existsSync(folder)) {
    if (runtime) {const target = resolve(runtime, 'node_modules'); verify(target); symlinkSync(target, folder, process.platform === 'win32' ? 'junction' : 'dir');}
    else {
      const npm = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
      run(process.execPath, [npm, 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], app);
    }
  }
  const result = {versions: verify(folder), lockSha256: hashFile(join(app, 'package-lock.json'))};
  writeJson(join(root, '.studio/deps.json'), result); return result;
}

export function preparePublish(root) {
  const checked = checkEdition(root, 'delivery'); if (!checked.ok) throw Error(checked.errors.join('\n'));
  const previous = read(root, 'publish-plan.json', {}), t = read(root, 'timeline.json');
  const variants = read(root, 'variants.json');
  if (!variants) throw Error('Write source-backed per-platform titles/descriptions/covers to variants.json first');
  for (const [platform, v] of Object.entries(variants.platforms ?? {})) {
    if (JSON.stringify(v.sceneIds) !== JSON.stringify(t.scenes.map(s => s.id)) || v.format?.fps !== 60 || v.format.width !== 1920 || v.format.height !== 1080) throw Error(`Full-episode export requires identical timeline/format: ${platform}`);
  }
  derive(root);
  const plan = read(root, 'publish-plan.json');
  for (const [platform, conf] of Object.entries(plan.platforms)) {
    Object.assign(conf, Object.fromEntries(Object.entries(previous.platforms?.[platform] ?? {}).filter(([key]) => ['category', 'topics', 'declare', 'original', 'timeoutSeconds'].includes(key))));
    if (platform !== 'bili' && !Object.hasOwn(previous.platforms?.[platform] ?? {}, 'topics')) conf.topics = ''; // Topics are optional; never auto-insert unrelated suggestions.
    conf.declare ??= {bili: '含AI生成内容', douyin: '内容由AI生成', xhs: '笔记含AI合成内容'}[platform];
    const exported = read(root, `exports/${platform}/timeline.json`);
    exported.cues = t.cues.map(c => ({start: Number((c.from/60).toFixed(3)), end: Number((c.to/60).toFixed(3)), text: c.text}));
    exported.subtitleTiming = t.timingMode; exported.voice = t.voice;
    writeJson(join(root, `exports/${platform}/timeline.json`), exported);
    copyFileSync(join(root, 'captions.srt'), join(root, `exports/${platform}/captions.srt`));
  }
  writeJson(join(root, 'publish-plan.json'), plan); return {platforms: Object.keys(plan.platforms), uploaded: false};
}

export function archiveEdition(root, destination) {
  const e = read(root, 'edition.json'), id = basename(destination);
  if (existsSync(destination) && readdirSync(destination).length) throw Error('Choose an unused archive revision; never overwrite an archive');
  const files = read(root, 'deliverables.json')?.files; if (!files?.length) throw Error('Declare actual deliverables.json before archiving');
  const archived = archiveProject(root, destination, {id, line: 'b', scope: 'source-inputs-and-deliverables', reproducibility: 'inputs-archived-rerender-not-certified', humanReview: e.production?.humanReview ?? 'pending'}, {deliverables: files});
  const verified = verifyArchive(archived.manifestPath); if (!verified.ok) throw Error('Archive verification failed');
  const restore = join(REPO, '.cache', `daily-restore-${Date.now()}`); mkdirSync(restore, {recursive: true});
  const restored = restoreArchive(archived.manifestPath, restore); if (!restored.ok) throw Error('Restore verification failed');
  const report = {archive: archived.manifestPath, verified, restoredTo: restore, restored, rerenderCertified: false, cleaned: false};
  writeJson(join(root, 'qa/archive-verification.json'), report); return report;
}

async function main() {
  const [cmd = 'status', ...argv] = process.argv.slice(2);
  const arg = (key, fallback) => {const i = argv.indexOf(`--${key}`); return i >= 0 && argv[i+1] && !argv[i+1].startsWith('--') ? argv[i+1] : fallback;};
  if (cmd === 'help' || argv.includes('--help')) return console.log('init --date YYYY-MM-DD [--source URL] [--project DIR]\nstatus --project DIR (or lists editions)\ncheck --project DIR --phase script|render|delivery\nrecording --project DIR --file AUDIO\ndeps --project DIR [--runtime EXISTING_REMOTION_APP]\ntranscribe --project DIR [--python EXE] [--model PATH_OR_NAME]\nalign --project DIR [--python EXE]\nrender --project DIR --mode stills|cover|sample|video [--range START,END]\npublish-materials --project DIR\narchive --project DIR --destination UNUSED_DIR');
  const specified = arg('project'), date = arg('date', today());
  if (cmd === 'status' && !specified) {
    const candidates = readdirSync(join(REPO, 'projects')).filter(n => /^daily-ai-news-\d{4}-\d{2}-\d{2}$/.test(n)).map(n => join(REPO, 'projects', n)).filter(p => existsSync(join(p, 'edition.json')));
    return console.log(JSON.stringify({today: today(), editions: candidates.map(p => ({project: p, date: read(p, 'edition.json').date, declaredStatus: read(p, 'edition.json').status})), next: 'Use explicit --project for the edition in this request; never silently resume or relabel an older date.'}, null, 2));
  }
  if (cmd !== 'init' && !specified) throw Error('Explicit --project required');
  const root = resolve(specified ?? join(REPO, 'projects', `daily-ai-news-${validDate(date)}`));
  let result;
  if (cmd === 'init') result = initEdition(root, date, arg('source'));
  else if (cmd === 'status') result = statusEdition(root);
  else if (cmd === 'check') {result = checkEdition(root, arg('phase', 'render')); if (!result.ok) process.exitCode = 1;}
  else if (cmd === 'recording') {if (!arg('file')) throw Error('--file required'); result = importRecording(root, resolve(arg('file')));}
  else if (cmd === 'deps') result = verifyDeps(root, arg('runtime'));
  else if (cmd === 'transcribe' || cmd === 'align') {
    const cachedPython = join(homedir(), '.cache/vibe-studio/asr-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    const python = arg('python', existsSync(cachedPython) ? cachedPython : 'python');
    const args = [join(HERE, cmd === 'transcribe' ? 'transcribe-recording.py' : 'align-recording.py'), '--project', root];
    if (cmd === 'transcribe') args.push('--model', arg('model', 'large-v3-turbo'));
    const child = spawnSync(python, args, {stdio: 'inherit', windowsHide: true}); if (child.error) throw child.error; if (child.status !== 0) process.exitCode = child.status ?? 1; return;
  }
  else if (cmd === 'render') {const {renderEdition} = await import('./render.mjs'); result = await renderEdition(root, {mode: arg('mode', 'stills'), range: arg('range')});}
  else if (cmd === 'publish-materials') result = preparePublish(root);
  else if (cmd === 'archive') {if (!arg('destination')) throw Error('--destination required; choose a new revision'); result = archiveEdition(root, resolve(arg('destination')));}
  else throw Error(`Unknown command ${cmd}; use help`);
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(e => {console.error(e.message); process.exitCode = 1;});
