// bili-fill.js — B 站投稿页：上传成片 + 填标题/正文/标签 + 创作声明 + 自查截图。
// 端口 9222（`bili.mjs launch` 开的窗口，人已扫码登录）。
// 不点「立即投稿」——那是人的动作。
//
//   node pw/bili-fill.js [--dry]      # --dry 只探针转储表单，不写
const { arg, hasFlag, loadPlaywright, loadSpec, setFiles, dumpForm, typeParagraphs, selfCheck } = require('./util');

const DRY = hasFlag('dry');
const spec = loadSpec('form.json');
const VIDEO = arg('video', '');
const COVER = arg('cover', '');

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('member.bilibili.com'));
  if (!page) throw new Error('没找到 B 站窗口（先跑 node ../../skills/publish/templates/bili.mjs launch 扫码）');
  await page.bringToFront();
  if (!/member\.bilibili\.com\/platform\/upload/.test(page.url())) {
    await page.goto('https://member.bilibili.com/platform/upload/video/frame', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  if (VIDEO) {
    const hit = await setFiles(page, ctx, [VIDEO], /上传中|重新上传|上传完成|百分|\d+%/);
    if (!hit) console.log('警告：没有 input 触发上传，检查探针输出');
    // 等转码/表单就绪：标题输入框可用
    await page.waitForSelector('input[placeholder*="标题"], .bili-input, #title-input input', { timeout: 300000 });
    await page.waitForTimeout(2000);
  }

  if (DRY) { await dumpForm(page, 'bili'); return; }

  // 1) 标题
  const title = page.locator('input[placeholder*="标题"], #title-input input, .bili-input').first();
  await title.click();
  await title.fill('');
  await title.fill(spec.title);
  console.log('标题 =', spec.title);

  // 2) 正文（Quill）：聚焦 + 逐段 insertText
  const editor = page.locator('.ql-editor[contenteditable="true"]').first();
  await typeParagraphs(page, editor, spec.description);
  console.log('正文已输入', spec.description.length, '段');

  // 3) 标签：输入 + 回车，逐个
  const tagInput = page.locator('input[placeholder*="标签"]').first();
  for (const t of spec.tags) {
    await tagInput.click();
    await tagInput.fill(t);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  console.log('标签 x', spec.tags.length);

  // 4) 分区（级联下拉）：点开「人工智能」——失败不阻塞，人工兜底
  try {
    await page.locator('.channel, [class*="category"] input, input[placeholder*="分区"]').first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    await page.locator('*:visible', { hasText: /^科技$/ }).first().click({ timeout: 4000 });
    await page.waitForTimeout(600);
    await page.locator('li, .bcc-option, [class*="option"]', { hasText: '人工智能' }).first().click({ timeout: 4000 });
    console.log('分区 = 科技/人工智能');
  } catch (e) {
    console.log('分区自动选择失败（人工兜底）：', e.message.slice(0, 80));
    await dumpForm(page, 'bili-category');
  }

  // 5) 创作声明：含AI生成内容（hsr 实测选择器）
  await page.click('.bcc-select, [class*="declare"] .bcc-select');
  await page.waitForTimeout(700);
  const opt = page.locator('li.bcc-option, [class*="option"]', { hasText: '含AI生成内容' }).first();
  await opt.click();
  await page.waitForTimeout(700);
  console.log('声明 = 含AI生成内容');

  await selfCheck(page, 'bili');
})().catch(async (e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
