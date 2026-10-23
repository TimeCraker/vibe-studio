// bili-fill.js — B 站投稿页：上传成片 + 填标题/正文/标签 + 创作声明 + 自查截图。
// 端口 9222（`bili.mjs launch` 开的窗口，人已扫码登录）。
// 不点「立即投稿」——那是人的动作。
//
//   node pw/bili-fill.js [--dry]      # --dry 离线预检；--probe 只读已打开页面
const { arg, hasFlag, loadPlaywright, loadSpec, qaPath, setFiles, dumpForm, typeParagraphs, selfCheck, race } = require('./util');

const DRY = hasFlag('dry');
const DECLARE = arg('declare', '');
const spec = hasFlag('probe') ? {title:'',description:[]} : loadSpec('form.json');
const VIDEO = arg('video', '');
const COVER = arg('cover', '');

if (!hasFlag('probe')) { const plan=require('./util').preflight('bili',spec); if (DRY) { console.log(JSON.stringify(plan)); process.exit(0); } }

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('member.bilibili.com'))
    ?? ctx.pages().find((p) => p.url().includes('bilibili.com'))
    ?? await ctx.newPage();
  page.setDefaultTimeout(20000);
  if (hasFlag('probe')) { await dumpForm(page, 'bili'); process.exit(0); }
  await page.bringToFront();
  if (!/member\.bilibili\.com\/platform\/upload/.test(page.url())) {
    await page.goto('https://member.bilibili.com/platform/upload/video/frame', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  if (VIDEO) {
    if (await page.locator('text=不用了').first().isVisible().catch(() => false)) throw new Error('Existing draft detected; select the intended draft manually before uploading');

    await page.screenshot({ path: qaPath('pw-bili-0-before-upload.png'), fullPage: false });

    // Playwright 原生文件选择器拦截：点「上传视频」，接住 chooser 设文件
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 15000 }),
      page.locator('button:has-text("上传视频"), div.upload-btn').first().click(),
    ]);
    await chooser.setFiles(VIDEO);
    console.log('已通过文件选择器提交视频');

    // 等转码/表单就绪：标题输入框出现
    await page.waitForSelector('input[placeholder*="标题"], .bili-input', { timeout: 300000 });
    await page.screenshot({ path: qaPath('pw-bili-1-uploaded.png'), fullPage: false });
    await page.waitForTimeout(2000);
  }


  const shot = (n) => page.screenshot({ path: qaPath(`pw-bili-${n}.png`), fullPage: false });

  // 1) 标题（清掉文件名自动填充）
  const title = page.locator('input[placeholder*="标题"], #title-input input, .bili-input').first();
  await title.click();
  await title.fill('');
  await title.fill(spec.title);
  console.log('标题 =', spec.title);
  await shot('2');

  // 2) 正文（Quill）：聚焦 + 逐段 insertText
  const editor = page.locator('.ql-editor[contenteditable="true"]').first();
  await typeParagraphs(page, editor, spec.description);
  console.log('正文已输入', spec.description.length, '段');
  await shot(3);

  // 3) 标签：先删掉自动猜的，再加我们的
  for (const wrong of ['欧美MV', '欧美音乐', 'MV', '电音', '电子音乐', '欧美']) {
    try {
      const chip = page.locator('[class*="tag"]', { hasText: wrong }).first();
      if (await chip.count()) {
        await chip.hover();
        await page.waitForTimeout(200);
        const x = chip.locator('[class*="close"], svg, i').last();
        await x.click({ timeout: 1500 });
        await page.waitForTimeout(250);
        console.log('已删除误猜标签:', wrong);
      }
    } catch { /* 没有这个标签就算了 */ }
  }
  const tagInput = page.locator('input[placeholder*="标签"]').first();
  for (const t of spec.tags) {
    await tagInput.click();
    await tagInput.fill(t);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  console.log('标签 x', spec.tags.length);
  await shot(4);

  if (arg('category','') === '人工智能') {
  // 4) 分区（级联下拉）：目标 科技 → 人工智能。失败不阻塞，人工兜底
  try {
    const cur = page.locator('text=绘画').first();
    await cur.click({ timeout: 4000 });
    await page.waitForTimeout(900);
    await page.locator('li, [class*="item"], [class*="option"]', { hasText: /^科技/ }).first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    await page.locator('li, .bcc-option, [class*="option"]', { hasText: '人工智能' }).first().click({ timeout: 4000 });
    console.log('分区 = 科技/人工智能');
    await shot(5);
  } catch (e) {
    console.log('分区自动选择失败（人工兜底）：', e.message.slice(0, 80));
  }

  } else if (arg('category','')) console.log('Category needs human selection: '+arg('category'));

  if (DECLARE) {
  // 5) 创作声明：含AI生成内容
  await page.click('.bcc-select, [class*="declare"] .bcc-select');
  await page.waitForTimeout(700);
  const opt = page.locator('li.bcc-option, [class*="option"]', { hasText: '含AI生成内容' }).first();
  await opt.click();
  await page.waitForTimeout(700);
  console.log('声明 = 含AI生成内容');

  }

  await selfCheck(page, 'bili');
})().then(() => process.exit(0)).catch(async (e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
