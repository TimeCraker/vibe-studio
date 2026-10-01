#!/usr/bin/env node
/**
 * run.mjs — 多平台并行投稿编排器。
 *
 *   node run.mjs --project <dir> [--only bili,douyin] [--dry]
 *
 * 读 <project>/publish-plan.json：
 *
 *   {
 *     "video":  "../../products/<项目>/成片.mp4",     // 相对项目根
 *     "cover":  "../../products/<项目>/封面.png",
 *     "platforms": {
 *       "bili":   { "declare": "内容由AI生成", "category": "人工智能" },
 *       "douyin": { "names": "AI,Gemini,人工智能" }
 *     }
 *   }
 *
 * 每个平台 spawn 一个独立的 <platform>.mjs setup 进程。各平台用自己的
 * Chrome profile 和调试端口（bili=9222，douyin=9223），互不干扰，所以可以并行跑。
 *
 * 分工不变：**脚本填表，发布按钮由人在每个平台各自点一次。**
 * 本脚本不提供发布命令，也不会替你点任何平台的发布。
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const flag = (k) => argv.includes(`--${k}`);

// 各平台的工具文件名与端口（与各 <platform>.mjs 的缺省值保持一致）
const PLATFORM_TOOL = {
  bili: { file: 'bili.mjs', port: 9222 },
  douyin: { file: 'douyin.mjs', port: 9223 },
};

const PROJECT = resolve(arg('project', process.cwd()));
const planPath = resolve(arg('plan', join(PROJECT, 'publish-plan.json')));
if (!existsSync(planPath)) throw new Error(`找不到发布清单: ${planPath}\n（结构见本文件头注释）`);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));

const wanted = (arg('only', '') || Object.keys(plan.platforms ?? {}).join(','))
  .split(',').map((s) => s.trim()).filter(Boolean);
const unknown = wanted.filter((p) => !plan.platforms?.[p]);
if (unknown.length) throw new Error(`publish-plan.json 里没有这些平台: ${unknown.join(', ')}`);
const badTool = wanted.filter((p) => !PLATFORM_TOOL[p]);
if (badTool.length) throw new Error(`还没有对应工具的平台: ${badTool.join(', ')}（在 templates/ 下新增 <platform>.mjs）`);

const abs = (p) => (p ? resolve(PROJECT, p) : null);
const dry = flag('dry');

console.log(`项目     ${PROJECT}`);
console.log(`平台     ${wanted.join(' + ')}`);
console.log(`视频     ${abs(plan.video) ?? '(无)'}`);
console.log(`封面     ${abs(plan.cover) ?? '(无)'}`);
console.log(`模式     ${dry ? 'DRY（只打印各平台将执行的步骤）' : '并行填表（发布按钮由你点）'}\n`);

if (!existsSync(abs(plan.video))) throw new Error(`成片不存在: ${abs(plan.video)}`);
if (dry) {
  for (const p of wanted) {
    const { file, port } = PLATFORM_TOOL[p];
    console.log(`━━ ${p} (port ${port}) ━━`);
    spawnFileSync(file, buildArgs(p, plan.platforms[p], true));
  }
  process.exit(0);
}

// 并行 spawn：每个平台一个进程、一个浏览器、一个端口
const children = wanted.map((p) => {
  const { file, port } = PLATFORM_TOOL[p];
  const child = spawn(process.execPath, [join(HERE, file), ...buildArgs(p, plan.platforms[p], false)], {
    cwd: PROJECT,
    env: { ...process.env },
  });
  child.stdout.on('data', (d) => process.stdout.write(`[${p}] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[${p}] ${d}`));
  return { p, child };
});

const results = await Promise.all(children.map(({ p, child }) =>
  new Promise((res) => child.on('close', (code) => res({ p, code })))));

console.log('\n━━ 汇总 ━━');
for (const { p, code } of results) {
  console.log(`${code === 0 ? 'OK ' : 'ERR'} ${p.padEnd(8)} exit ${code}`);
}
const failed = results.filter((r) => r.code !== 0);
console.log(failed.length
  ? `\n有平台没走完，看上面的输出。已就绪的平台自己去窗口点「发布」。`
  : `\n全部就绪。去每个平台各自的窗口点「发布」—— 那一步永远是你的。`);
process.exit(failed.length ? 1 : 0);

// --------------------------------------------------------------------------- //
function buildArgs(platform, conf, isDry) {
  const args = ['setup', '--project', PROJECT];
  if (isDry) args.push('--dry');
  const video = abs(plan.video);
  const cover = abs(plan.cover);
  if (platform === 'bili') {
    if (video) args.push('--path', video);
    if (cover) args.push('--image', cover);
    if (conf.spec) args.push('--spec', conf.spec);
    if (conf.declare) args.push('--declare', conf.declare);
    if (conf.category) args.push('--category', conf.category);
  } else if (platform === 'douyin') {
    if (video) args.push('--video', video);
    if (cover) args.push('--image', cover);
    if (conf.spec) args.push('--spec', conf.spec);
    if (conf.names) args.push('--names', conf.names);
    if (conf.declare) args.push('--declare', conf.declare);
  }
  return args;
}

function spawnFileSync(file, args) {
  // dry 模式下顺序执行即可（只是打印各平台的步骤）
  const r = spawnSync(process.execPath, [join(HERE, file), ...args], { encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
}
