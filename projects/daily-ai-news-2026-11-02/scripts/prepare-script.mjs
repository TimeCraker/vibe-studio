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
  ['longcat-access', '网页与接口可体验，权重入口仍待开放', '模型头条', ['longcat-release', 'longcat-demos'], 'LongCat发布页；GitHub/HuggingFace敬请期待'],
  ['dsh-intro', '社区DSH安卓版把执行引擎装进手机', '开源手机助手', ['dsh-engine'], 'DSH-Android社区项目；非DeepSeek官方客户端'],
  ['dsh-example', '查文件、开勿扰，需联网和权限适配', '开源手机助手', ['dsh-engine', 'dsh-limits'], '项目说明与v0.3.6发布记录，非本栏目实测'],
  ['coral-problem', 'CORAL研究长任务中的上下文混乱', '智能体研究', ['coral-method'], 'CORAL论文，2026-10-29'],
  ['coral-memory', '保存已核事实和进度，再清理上下文', '智能体研究', ['coral-method'], 'CORAL论文§3；非本栏目实测'],
  ['coral-result', '论文实验：准确率约19%到43%', '智能体研究', ['coral-results'], '论文表1/2，包含专门训练；非本栏目实测'],
  ['security-risk', 'ClickHouse披露服务器执行代码漏洞', '安全简讯', ['clickhouse-security'], 'ClickHouse官方安全更新，2026-10-30'],
  ['security-fix', '自托管核对修复，云与BYOC已修', '安全简讯', ['clickhouse-security'], 'ClickHouse官方安全更新，2026-10-30'],
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
  {title: '社区DSH安卓版把执行引擎装进手机', detail: '授权后处理文件与操作App'},
  {title: 'CORAL保存任务进度再清理上下文', detail: '论文实验，包含专门训练'},
  {title: '自托管ClickHouse需核对安全修复', detail: '官方Cloud/BYOC已应用修复'}
];
content.scenes = paragraphs.map((text, i) => ({id: scenes[i][0], title: scenes[i][1], section: scenes[i][2], source: scenes[i][4], anchor: text.slice(0, 16), claimIds: scenes[i][3]}));
write('content.json', content);
const edition = read('edition.json');
edition.status = 'script-ready';
write('edition.json', edition);
console.log('Edited narration characters:', [...body.replace(/\s/g, '')].length);
