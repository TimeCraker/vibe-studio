// xhs-fill.js — 小红书发布页：上传成片 + 标题/正文/话题 + 原创与 AI 合成声明 + 自查截图。
// 端口 9224（`xhs.mjs launch` 开的窗口，人已扫码；登录卡右上角可切二维码）。
// 不点「发布」——那是人的动作。
//
//   node pw/xhs-fill.js [--dry] [--video <mp4>] [--topics 鹈鹕,AI绘画]
const { arg, hasFlag, loadPlaywright, loadSpec, setFiles, dumpForm, typeParagraphs, selfCheck } = require('./util');
const {appendTopics,selectXhsDeclaration,assertExistingVideo} = require('./form-actions');

const DRY = hasFlag('dry');
const DECLARE = arg('declare', '');
const spec = hasFlag('probe') ? {title:'',description:[]} : loadSpec('xhs-form.json');
const VIDEO = arg('video', '');
const TOPICS = (arg('topics', '')).split(',').map((s) => s.trim()).filter(Boolean);

if (!hasFlag('probe')) { const plan=require('./util').preflight('xhs',spec); if (DRY) { console.log(JSON.stringify(plan)); process.exit(0); } }

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('creator.xiaohongshu'));
  if (!page) throw new Error('没找到小红书窗口（先跑 node skills/publish/templates/xhs.mjs launch 扫码）');
  page.setDefaultTimeout(10000);
  if (hasFlag('probe')) { await dumpForm(page, 'xhs'); process.exit(0); }
  await page.bringToFront();
  if (!page.url().includes('/publish/publish')) {
    await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
  }

  if (VIDEO) {
    if (await page.locator('input[placeholder*="标题"]').first().isVisible().catch(()=>false)) await assertExistingVideo(page, VIDEO);
    else await setFiles(page, ctx, [VIDEO], /上传中|%|重新上传|上传成功/);
    await page.waitForTimeout(6000); // 等推荐封面条出现（别急着编辑正文，会弄没 AI 推荐话题条）
  }


  // 1) 标题
  const title = page.locator('input[placeholder*="标题"], input[placeholder*="标题"]').first();
  await title.click();
  await title.fill(spec.title);
  console.log('标题 =', spec.title);

  // 2) 正文（TipTap：只聚焦，不碰选区；清空走 Ctrl+A + Backspace 真实按键）
  const editor = page.locator('#post-textarea [contenteditable="true"], .edit-area [contenteditable="true"], [contenteditable="true"]').first();
  await editor.click();
  await typeParagraphs(page, editor, spec.description);
  console.log('正文已输入', spec.description.length, '段');

  const topics = await appendTopics(page, editor, spec.description, TOPICS, 'xhs', () => typeParagraphs(page, editor, spec.description));

  let declarationVerified = false;
  if (DECLARE) {
  // 4) 原创声明（开关 → 二段确认）+ 「添加内容类型声明」→ 笔记含AI合成内容
  try {
    if (hasFlag('original')) {
    await page.locator('[class*="original"], div', { hasText: '声明原创' }).first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    const agree = page.locator('input[type=checkbox], .checkbox', { hasText: '' }).first();
    const bb = await agree.boundingBox().catch(() => null);
    if (bb) { await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); } // 0 高隐藏 input 按坐标点
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: '声明原创' }).first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    }
    declarationVerified = await selectXhsDeclaration(page, DECLARE);
    console.log('声明 = 笔记含AI合成内容');
  } catch (e) {
    console.log('原创/AI 声明自动流程失败（人工兜底）：', e.message.slice(0, 80));
    await dumpForm(page, 'xhs-declare');
    throw e;
  }

  }

  await selfCheck(page, 'xhs', {editor, ...topics, declarationVerified});
})().then(() => process.exit(0)).catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
