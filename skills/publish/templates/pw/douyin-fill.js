// douyin-fill.js — 抖音投稿页：上传成片 + 标题/正文/话题/AI 声明 + 自查截图。
// 端口 9223（`douyin.mjs launch` 开的窗口，人已扫码登录）。
// 不点「发布」——那是人的动作。选择器为 2026-10-03 三端 live 实测版，页面改版先用 --dry 探针。
//
//   node pw/douyin-fill.js [--dry] [--video <mp4>] [--names A,B,C]
const { arg, hasFlag, loadPlaywright, loadSpec, setFiles, dumpForm, typeParagraphs, selfCheck } = require('./util');
const {appendTopics,selectDouyinDeclaration,assertExistingVideo} = require('./form-actions');

const DRY = hasFlag('dry');
const DECLARE = arg('declare', '');
const spec = hasFlag('probe') ? {title:'',description:[]} : loadSpec('douyin-form.json');
const VIDEO = arg('video', '');
const NAMES = (arg('names', '')).split(',').map((s) => s.trim()).filter(Boolean);

if (!hasFlag('probe')) { const plan=require('./util').preflight('douyin',spec); if (DRY) { console.log(JSON.stringify(plan)); process.exit(0); } }

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('creator.douyin.com'));
  if (!page) throw new Error('没找到抖音窗口（先跑 node skills/publish/templates/douyin.mjs launch 扫码）');
  page.setDefaultTimeout(10000);
  if (hasFlag('probe')) { await dumpForm(page, 'douyin'); process.exit(0); }
  await page.bringToFront();
  if (!/content\/(upload|post\/video)/.test(page.url())) {
    await page.goto('https://creator.douyin.com/creator-micro/content/upload', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
  }

  if (VIDEO) {
    if (page.url().includes('/content/post/video')) await assertExistingVideo(page, VIDEO);
    else await setFiles(page, ctx, [VIDEO], /上传中|%|重新上传|上传完成/);
    await page.waitForSelector('input[placeholder*="标题"]', { timeout: 300000 });
    await page.waitForTimeout(3000);
  }
  if (!page.url().includes('/content/post/video')) console.log('提示：当前不在发布表单页（' + page.url().slice(0, 90) + '），继续尝试');


  // 1) 标题
  const title = page.locator('input[placeholder*="标题"]').first();
  await title.click();
  await title.fill(spec.title);
  console.log('标题 =', spec.title);

  // 2) 正文（editor-kit：聚焦后逐段输入）
  const editor = page.locator('.zone-container.editor-kit-container[contenteditable="true"], .zone-container.editor-kit-container [contenteditable="true"], [contenteditable="true"]').first();
  await typeParagraphs(page, editor, spec.description);
  console.log('正文已输入', spec.description.length, '段');

  const topics = await appendTopics(page, editor, spec.description, NAMES, 'douyin', () => typeParagraphs(page, editor, spec.description));
  const declarationVerified = DECLARE ? await selectDouyinDeclaration(page, DECLARE) : false;
  await selfCheck(page, 'douyin', {editor, ...topics, declarationVerified});
})().then(() => process.exit(0)).catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
