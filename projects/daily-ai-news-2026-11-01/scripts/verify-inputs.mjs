// 本期输入自检：素材哈希、场景引用、claims、榜单官标、口播锚点。
// 用法：node projects/daily-ai-news-2026-11-01/scripts/verify-inputs.mjs [--write]
// 退出码 0 = 全部通过，1 = 有失败项。
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));
const has = (rel) => existsSync(join(root, rel));
const sha256 = (rel) => createHash('sha256').update(readFileSync(join(root, rel))).digest('hex');

const failures = [];
const warnings = [];
const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}: ${detail}`);
};

const sources = readJson('assets/sources.json');
const list = Array.isArray(sources) ? sources : sources.sources ?? [];
const content = readJson('content.json');
const claims = readJson('claims.json');
const ranking = readJson('ranking.json');
const narration = readFileSync(join(root, 'narration.md'), 'utf8');
const body = narration.split('## 朗读正文')[1]?.split('## 录音说明')[0] ?? '';

// 1. 每个登记的素材文件都存在，且哈希与记录一致。
let hashed = 0;
for (const s of list) {
  if (!s.file) continue;
  if (!has(s.file)) { add('素材存在', false, `${s.file} 不在工程内`); continue; }
  hashed += 1;
  if (s.sha256 && sha256(s.file) !== s.sha256) add('素材哈希', false, `${s.file} 与 sources.json 记录不一致`);
  if (!s.rights) add('使用条件', false, `${s.file} 缺 rights`);
  if (!(s.url || s.sourcePage || s.sourceUrl)) {
    if (s.localSource) warnings.push(`${s.file} 是本地复用文件（${s.localSource}），没有上游链接；靠哈希和 name 表核对身份`);
    else add('来源', false, `${s.file} 缺来源链接`);
  }
}
add('素材文件与哈希', true, `已核对 ${hashed} 个登记文件`);

// 2. content.json 引用的图片、字体、音乐都在 assets 下。
const referenced = new Set();
for (const s of content.scenes ?? []) if (s.media?.file) referenced.add(s.media.file);
if (content.headline?.logo) referenced.add(content.headline.logo);
if (content.fonts?.sans) referenced.add(content.fonts.sans);
if (content.fonts?.mono) referenced.add(content.fonts.mono);
if (content.music?.file) referenced.add(content.music.file);
for (const f of referenced) if (!has(f)) add('文案引用文件', false, `${f} 不存在`);

// 3. 文案引用的素材都登记在 sources.json。
const registered = new Set(list.map((s) => s.file));
for (const f of referenced) if (!registered.has(f)) add('素材登记', false, `${f} 已使用但未登记`);

// 4. 场景 claimIds 必须能在 claims.json 找到且为 verified。
const claimMap = new Map(claims.map((c) => [c.id, c]));
for (const s of content.scenes ?? []) {
  for (const id of s.claimIds ?? []) {
    const c = claimMap.get(id);
    if (!c) add('事实引用', false, `场景 ${s.id} 引用了不存在的 claim ${id}`);
    else if (c.status !== 'verified') add('事实状态', false, `${id} 状态为 ${c.status}`);
  }
}
add('事实引用完整', true, `${content.scenes?.length ?? 0} 个场景，${claims.length} 条 claim`);

// 5. 榜单 15+15、降序、官标文件存在且已登记。
for (const kind of ['global', 'domestic']) {
  const rows = ranking[kind] ?? [];
  add(`${kind} 条数`, rows.length === 15, `实际 ${rows.length} 条`);
  add(`${kind} id 唯一`, new Set(rows.map((r) => r.id)).size === rows.length, '存在重复 id');
  const descending = rows.every((r, i) => i === 0 || r.eci <= rows[i - 1].eci);
  add(`${kind} 降序`, descending, '分数不是从高到低');
  for (const r of rows) {
    if (!r.icon) { add('官标', false, `${r.name} 缺 icon`); continue; }
    if (!has(r.icon)) add('官标文件', false, `${r.icon} 不存在`);
    if (!registered.has(r.icon)) add('官标登记', false, `${r.icon} 未在 sources.json 登记`);
  }
}
add('榜单官标', true, '全球与国产各 15 条逐行检查');

// 6. narration 里的锚点必须出现在朗读正文里。
for (const s of content.scenes ?? []) {
  if (!s.anchor) { add('口播锚点', false, `场景 ${s.id} 缺 anchor`); continue; }
  if (!body.includes(s.anchor.split(' ')[0])) add('口播锚点', false, `场景 ${s.id} 的锚点不在朗读正文中: ${s.anchor}`);
}
add('口播锚点可定位', true, `${content.scenes?.length ?? 0} 个场景`);

// 7. 录音稿与实际是否已有录音/时间线。
if (has('timeline.json')) warnings.push('已存在 timeline.json，说明录音可能已接入；本自检只看输入，不验证对齐结果');
else warnings.push('尚无录音与时间线：当前是口播稿交付阶段，字幕与镜头时长以实际录音为准');

const report = {
  checkedAt: new Date().toISOString(),
  project: root,
  editionDate: content.headline ? readJson('edition.json').date : null,
  summary: { checks: checks.length, failures: failures.length, warnings: warnings.length },
  failures,
  warnings,
  checks,
};
if (process.argv.includes('--write')) {
  mkdirSync(join(root, 'qa'), { recursive: true });
  writeFileSync(join(root, 'qa', 'inputs-check.json'), JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report.summary, null, 2));
for (const f of failures) console.log(`FAIL ${f}`);
for (const w of warnings) console.log(`WARN ${w}`);
console.log(failures.length ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(failures.length ? 1 : 0);
