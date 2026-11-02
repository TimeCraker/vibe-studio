import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
const write = (name, value) => writeFileSync(resolve(root, name), JSON.stringify(value, null, 2) + '\n');
const checkedAt = new Date().toISOString();
const source = (url, locator, path) => ({url, locator, checkedAt, ...(path ? {path} : {})});
const dsh = 'https://github.com/jackwener/DSH-Android';
const coral = 'https://arxiv.org/html/2610.40350v1';
const clickhouse = 'https://clickhouse.com/docs/resources/changelogs/security-changelog';
write('selection.json', {
  decision: 'produce',
  independentSearch: [
    {checkedAt, query: 'technology AI announcements November 2 2026 official model open source / 科技 2026年11月2日 发布 开源 芯片', result: '第一轮独立检索，命中模型目录、行业转载、预测日程，未以搜索标题作发布证据；未发现足够可靠的当天旗舰官宣。'},
    {checkedAt, query: 'November 2, 2026 release model AI / 2026年11月2日 发布 科技', url: 'https://docs.x.ai/developers/migration/imagine-image-quality-nov-2', result: '主动发现xAI图像接口迁移，读取官方文档，属于接口别名与价格默认值变化，降为备选。'},
    {checkedAt, query: '近期材料/能源/芯片与科技进展，核对原始发布', url: 'https://www.iluvatar.com/news', result: '查到天垓300媒体演示线索，官方站新闻列表此次未返回该活动可读原文；不得采用未经核实的全负载性能结论。检索未全面覆盖所有领域。'},
    {checkedAt, query: 'site.cas.cn 2026-11-02 材料 能源 / site.nature.com 02 November 2026 energy materials / 60MW 液态空气 中国绿发 2026 并网', url: 'https://www.thepaper.cn/newsDetail_forward_34384486', result: '补充检索材料/能源，发现格尔木60MW液态空气储能10月30日并网、11月1日项目参与方政务号跟进；作为工程专题备选，未因非AI排除。'}
  ],
  documentSupplement: [
    {url: 'https://feishu.doubao.com/docx/WXjSdNCoboPqcjxCzy9cyvQqn2c', checkedAt, scope: '实际滚动读取八部分及14项来源至页尾，evidence/browser-observations.md', result: '补充DSH-Android、CORAL和ClickHouse，分别回溯项目/论文/官方公告，不默认全部入片。'}
  ],
  selected: [
    {id: 'dsh', tier: '头条', title: '社区DSH安卓版把执行引擎装进手机', url: dsh, reason: '手机上授权操作App与文件有普通观众能理解的实际用途，区分本地执行引擎、远程客户端与离线模型；项目本次仍在更新，最新发布11月1日。不是因为涨星入选。', limits: '社区项目，非官方客户端；Android10+ arm64，需模型服务，最新v0.3.6作者注明未真机测试。'},
    {id: 'coral', tier: '次重点', title: 'CORAL先保存进度再清理上下文', url: coral, reason: '解释长任务越做越乱的具体问题；用一个机制和一组同实验结果说明，训练边界保留。', eventDate: '2026-10-29', limits: '论文实验，非本栏目实测，结果包含SFT和RL，不承诺通用助手直接复现。'},
    {id: 'clickhouse', tier: '简讯', title: '自托管ClickHouse核对安全修复', url: clickhouse, reason: '未认证远程执行风险、修复已出，仍有明确行动价值，安全小更新可因影响升格。', eventDate: '2026-10-30', limits: '特定条件，不是网络可达即必然利用；Cloud/BYOC已修，不传播未证实根因与攻击端口。'}
  ],
  rejected: [
    {title: 'GPT-6.2 Astra / Mythos5.5泄密', reason: '文档自己标为爆料，未取得官方发布证据，不以传闻做头条或写入事实稿。'},
    {title: 'FUMO Fusion开源模型', url: 'https://github.com/Fumo-Lab', reason: '官方介绍为多模型复合系统、API邀请制；目录上新不等于当日发布，当前证据不支持开源权重说法。'},
    {title: '来也ADP MCP', url: 'https://developer.cloud.tencent.com/mcp/server/11820', reason: '原页面为10月27日，并非11月1日新上线；本期未找到新增能力，目录条目不上正文。'},
    {title: 'anthropics/skills / MemPalace涨星', reason: '单日涨星不足以说明新能力或可靠性；未以best-benchmarked自述代替评测，不占正文。'},
    {title: 'Perplexity加入Rust Foundation', url: 'https://rustfoundation.org/media/category/news/', reason: '官方成员公告日期为9月23日；本期无新事件，不能外推Rust是所有Agent系统事实标准。'},
    {title: 'Kubernetes1.34 EOL与补丁排期', reason: '非本期新变化，面向特定维护者的例行排期；没有新增风险证据，留来源参考，不额外堆安全条目。'},
    {title: '天垓300实机演示与H200对比', reason: '媒体所指演示发生10月28日；自测/第三方口径在转载间冲突，本次未取得支撑具体性能比较的一手原文，待核不播。不是因为非AI淘汰。'},
    {title: '风华一号/UOS适配', reason: '兼容认证对本期普通受众价值有限，没有核实新的重大能力变化，不照抄最适配的营销判断。'},
    {title: 'Craft CMS防护库收录', reason: '防护规则收录不等于新漏洞发布；本期未补齐核心官方影响/修复链，ClickHouse已承担可行动安全简讯。'},
    {title: 'PyRUA-Lean', reason: '同一期已有更容易解释且已核实的CORAL研究；该条需要额外模拟环境/基线限定，没有独立到值得增加本期解释成本，不将未核数字入稿。'},
    {title: '校招岗位合集', reason: '一般岗位汇总不属于本期重大科技变化，省去职位、薪酬和截止提醒。'},
    {title: 'xAI旧图像接口别名迁移', url: 'https://docs.x.ai/developers/migration/imagine-image-quality-nov-2', reason: '独立发现且官方可核：旧quality别名切至2.0 low，单图便宜$0.01；适用面窄、迁移已预告，保留备选，不给本期再加一条版本提醒。'},
    {title: '格尔木60MW液态空气储能并网', url: 'https://www.thepaper.cn/newsDetail_forward_34384486', reason: '独立检索补充，10月30日并网有参与方11月1日跟进；可做工程专题备选。本次未取得该装置运行效率、持续放电及成本的一手实测数据，不将并网等同规模化经济性已验证；本期优先用途与结果边界更清楚的AI工具主线。并非因非AI或已有三条拒绝。'}
  ],
  notes: '先核实后按独立价值与解释成本分层；不设条数配额。已自行精简第一稿，不把旁枝全转塞进画面。相关素材当前只有作者截图与论文，无已取得/已入片录像。'
});
write('claims.json', [
  {id: 'ranking', text: '本次全球/国产ECI TOP15已按当前页面核对，精确值取11月2日开源快照，不合并同名不同id，不造升降。', status: 'verified', source: source('https://raw.githubusercontent.com/liyupi/ai-model-world/main/data/models.json', 'models[].benchmarks.eci；ranking.json及browser-observations.md', 'evidence/ranking-upstream.json')},
  {id: 'dsh-engine', text: 'DSH-Android社区项目把DSH引擎放在Android App进程中，免Root/Termux，支持授权后的文件、文档与无障碍读屏操作；需要模型服务，非离线大模型。', status: 'verified', source: source(dsh, 'README：亮点/能做什么/架构/系统要求', 'evidence/dsh-readme.md')},
  {id: 'dsh-limits', text: 'Android10+ arm64-v8a；任务可暂停插话，v0.3.6发布记录注明这版未真机测试。', status: 'verified', source: source(dsh + '/releases/tag/v0.3.6', 'v0.3.6 11月1日发布记录，未真机测试；系统要求', 'evidence/dsh-releases-page.html')},
  {id: 'coral-method', text: '10月29日提交CORAL，保存进度与已核事实后清理杂乱上下文继续推理；使用专门行为克隆和强化学习。', status: 'verified', source: source(coral, '摘要、§3、§4.2 Impact of Training；arxiv abs提交日期', 'evidence/coral-paper.html')},
  {id: 'coral-results', text: '论文Qwen3-8B GAIA实验ReAct平均19.4%、CORAL RL42.8%；输入token减少87.4%。口播约19%到43%，仅描述同论文实验，非普遍承诺。', status: 'verified', source: source(coral, '表1、表2与§4.2/§4.3；103题×8次轨迹', 'evidence/coral-paper.html')},
  {id: 'clickhouse-security', text: '10月30日CVE-2026-116366：特定条件下有网络访问的未认证用户可执行任意代码；修复26.3.62.3-lts、26.8.36.3-lts、26.9.27.3-stable、26.10.3.7-stable；Cloud及BYOC已修复。', status: 'verified', source: source(clickhouse, 'Fixed in ClickHouse v26.10.3.7, 2026-10-30 第一条公告', 'evidence/clickhouse-security.html')}
]);
const body = readFileSync(resolve(root, 'narration.md'), 'utf8').split('## 朗读正文')[1].split('## 录音说明')[0].trim();
const refs = ['overview', 'dsh-intro', 'dsh-example', 'dsh-limits', 'coral-problem', 'coral-memory', 'coral-result', 'security-risk', 'security-fix', 'closing'];
const paragraphs = body.split(/\n\s*\n/);
if (paragraphs.length !== refs.length) throw Error('Narration paragraph mapping changed');
write('script.json', {meta: {title: '2026-11-02 每日AI资讯', lang: 'zh-CN', budgetSeconds: 180, charsPerSecond: 4.5, bannedWords: ['重磅来袭', '颠覆一切']}, segments: paragraphs.map((text, i) => ({id: refs[i], kind: 'voiceover', text, ref: refs[i]}))});
const content = read('content.json');
content.headline = {title: '开源DSH装进安卓手机', subtitle: '社区项目，执行引擎本机运行；模型服务仍需联网', logo: 'assets/dsh-hero.webp', source: 'jackwener/DSH-Android，项目说明；非DeepSeek官方客户端'};
content.stories = [
  {title: '社区DSH安卓版把执行引擎装进手机', detail: '授权后处理文件与操作App'},
  {title: 'CORAL保存任务进度再清理上下文', detail: '论文实验，包含专门训练'},
  {title: '自托管ClickHouse需核对安全修复', detail: '官方Cloud/BYOC已应用修复'}
];
const sceneTitles = ['今日AI资讯', '社区DSH安卓版把执行引擎装进手机', '用自然语言查文件、打开勿扰', '需要联网与授权，实际适配待验证', 'CORAL研究长任务中的上下文混乱', '保存已核事实和进度，再清理上下文', '论文实验：准确率约19%到43%', 'ClickHouse披露服务器执行代码漏洞', '自托管核对修复，云与BYOC已修', '我们下期见'];
const ids = [[], ['dsh-engine'], ['dsh-engine'], ['dsh-limits', 'dsh-engine'], ['coral-method'], ['coral-method'], ['coral-results'], ['clickhouse-security'], ['clickhouse-security'], []];
content.scenes = paragraphs.map((text, i) => ({id: refs[i], title: sceneTitles[i], section: i === 0 ? '今日AI资讯' : i < 4 ? '开源手机助手' : i < 7 ? '智能体研究' : i < 9 ? '安全简讯' : '本期结束', source: i < 4 ? 'DSH-Android社区项目说明；非本栏目实测' : i < 7 ? 'CORAL论文，2026-10-29；非本栏目实测' : i < 9 ? 'ClickHouse官方安全更新，2026-10-30' : '2026-11-02', anchor: text.slice(0, 16), claimIds: ids[i]}));
write('content.json', content);
const edition = read('edition.json');
edition.status = 'script-ready';
write('edition.json', edition);
console.log('Edited narration characters:', [...body.replace(/\s/g, '')].length);
