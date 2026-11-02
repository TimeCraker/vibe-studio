import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
const write = (name, value) => writeFileSync(resolve(root, name), JSON.stringify(value, null, 2) + '\n');
// Editorial decisions and verified claims are maintained in their own files.
// Rebuilding script/scene inputs must not rewrite their research history.
const body = readFileSync(resolve(root, 'narration.md'), 'utf8').split('## 朗读正文')[1].split('## 录音说明')[0].trim();
const scenes = [
  ['overview', '今日AI资讯', '今日AI资讯', [], ''],
  ['longcat-release', '美团LongCat-2.5正式版开放接口', '模型头条', ['longcat-release'], 'LongCat官方更新日志，2026-11-02'],
  ['longcat-demos', '官方演示：三维展览与商业分析', '模型头条', ['longcat-demos'], '美团官方演示，非本栏目实测'],
  ['carbon-release', 'Gemini4 Carbon强调长任务与安全能力', '近期模型进展', ['carbon-release'], 'Google官方公告，2026-10-28；非当日首发'],
  ['carbon-limits', '评测有条件，初期面向可信伙伴开放', '近期模型进展', ['carbon-release'], 'Google发布口径，非本栏目实测'],
  ['genie-world', 'Genie4支持实时修改交互世界与声音', '近期世界模型', ['genie4-release'], 'Google官方演示，2026-10-27；非本栏目实测'],
  ['genie-limits', '研究预览，交互时长与一致性仍有限', '近期世界模型', ['genie4-limits'], 'Google官方Limitations，非成熟游戏引擎'],
  ['gdpx-tasks', 'GDPx在11领域检验复杂工作能力', '当日评测', ['gdpx-launch'], 'SemiAnalysis发布，2026-11-02'],
  ['gdpx-scores', '12%是本评测综合分，非现实成功率', '当日评测', ['gdpx-score', 'gdpx-method'], 'GDPx默认Score；领域等权，混合评分，三次尝试均值'],
  ['closing', '我们下期见', '本期结束', [], '2026-11-02']
];
const paragraphs = body.split(/\n\s*\n/);
if (paragraphs.length !== scenes.length) throw Error('Narration paragraph mapping changed');
const claimIds = new Set(read('claims.json').map(c => c.id));
for (const scene of scenes) for (const id of scene[3]) if (!claimIds.has(id)) throw Error(`Missing claim ${id}`);
write('script.json', {meta: {title: '2026-11-02 每日AI资讯', lang: 'zh-CN', budgetSeconds: 180, charsPerSecond: 4.5, bannedWords: ['重磅来袭', '颠覆一切']}, segments: paragraphs.map((text, i) => ({id: scenes[i][0], kind: 'voiceover', text, ref: scenes[i][0]}))});
const content = read('content.json');
content.headline = {title: '美团LongCat-2.5正式版上线', subtitle: '原生多模态与长任务编程；网页和接口可体验', logo: 'assets/longcat-logo.svg', source: '美团LongCat官方发布与更新日志；非本栏目实测'};
content.stories = [
  {title: '美团LongCat-2.5正式版开放接口', detail: '视觉理解结合长任务编程'},
  {title: '谷歌Gemini4 Carbon强化长任务与安全能力', detail: '10月28日发布，用户指定近期补充'},
  {title: 'Genie4生成可交互世界与原生声音', detail: '10月27日研究预览，近期补报'},
  {title: 'GDPx检验复杂专业工作能力', detail: '11月2日新评测，分数不等于现实成功率'}
];
content.scenes = paragraphs.map((text, i) => ({id: scenes[i][0], title: scenes[i][1], section: scenes[i][2], source: scenes[i][4], anchor: text.slice(0, 16), claimIds: scenes[i][3]}));
const media = {
  'longcat-demos': {kind: 'video', file: 'assets/longcat-3d-demo.mp4', sourceIn: 0, sourceOut: 12, poster: 'assets/longcat-3d-poster.jpg', label: '美团官方生成案例；非本栏目实测'},
  'carbon-release': {kind: 'image', file: 'assets/carbon-official-hero.png', label: 'Google官方发布图，2026-10-28'},
  'carbon-limits': {kind: 'image', file: 'assets/carbon-official-secbench.webp', label: 'Google发布的限定评测结果；非本栏目实测'},
  'genie-world': {kind: 'video', file: 'assets/genie4-balloon-demo.webm', sourceIn: 0, sourceOut: 14.5, poster: 'assets/genie4-official-hero.webp', label: 'Google官方Genie4交互演示；保留原免责声明'},
  'genie-limits': {kind: 'video', file: 'assets/genie4-cloth-demo.webm', sourceIn: 0, sourceOut: 16.5, poster: 'assets/genie4-official-hero.webp', label: 'Google官方Genie4生成画面，非真实场景记录'},
  'gdpx-scores': {kind: 'image', file: 'assets/gdpx-official-ranking.webp', label: 'GDPx默认Score，百分比不是现实成功率'}
};
for (const scene of content.scenes) if (media[scene.id]) scene.media = media[scene.id];
write('content.json', content);
const edition = read('edition.json');
edition.status = 'script-ready';
write('edition.json', edition);
console.log('Edited narration characters:', [...body.replace(/\s/g, '')].length);
