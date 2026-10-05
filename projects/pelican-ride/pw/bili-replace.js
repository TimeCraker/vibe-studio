// bili-replace.js — 就地把旧草稿换成 pelican-ride：
// 更换视频 → 清标题重填 → 清正文重填 → 清旧标签加新标签 → 分区 → 声明校验 → 逐步截图。
// 不点「立即投稿」。
const { loadPlaywright, loadSpec, race, typeParagraphs } = require('./util');
const S = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'form.json'), 'utf8'));
const VIDEO = process.argv[2] ?? '';
const shot = (page, n) => page.screenshot({ path: `qa/pw-bili-r${n}.png`, fullPage: false });

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => p.url().includes('member.bilibili.com'));
  if (!page) throw new Error('没找到投稿页');
  page.setDefaultTimeout(20000);

  // ---- 1) 更换视频 ---- //
  if (VIDEO) {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 15000 }),
      race(page.locator('text=更换视频').first().click({ timeout: 8000 }), 12000, 'click 更换视频'),
    ]);
    await chooser.setFiles(VIDEO);
    console.log('已提交更换视频');
    await page.waitForSelector('text=上传完成', { timeout: 300000 });
    console.log('新视频上传完成');
  }

  // ---- 2) 标题 ---- //
  const title = page.locator('input[placeholder*="标题"], #title-input input, .bili-input').first();
  await title.click();
  await title.fill('');
  await title.fill(S.title);
  console.log('标题 =', S.title);
  await shot(page, 1);

  // ---- 3) 正文：清空重填（Ctrl+A + Backspace 真实按键）---- //
  const editor = page.locator('.ql-editor[contenteditable="true"]').first();
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);
  await typeParagraphs(page, editor, S.description);
  console.log('正文已重填', S.description.length, '段');
  await shot(page, 2);

  // ---- 4) 标签：删旧加新 ---- //
  for (const wrong of ['竞技游戏', '桌游棋牌', '卡牌游戏']) {
    try {
      const chip = page.locator('[class*="tag"]', { hasText: wrong }).first();
      if (await chip.count()) {
        await chip.hover();
        await page.waitForTimeout(200);
        await chip.locator('[class*="close"], svg, i').last().click({ timeout: 1500 });
        await page.waitForTimeout(250);
        console.log('已删除旧标签:', wrong);
      }
    } catch { /* 无则跳过 */ }
  }
  const tagInput = page.locator('input[placeholder*="标签"]').first();
  for (const t of S.tags) {
    await tagInput.click();
    await tagInput.fill(t);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
  }
  console.log('标签已加', S.tags.length, '个');
  await shot(page, 3);

  // ---- 5) 分区：游戏 → 科技/人工智能 ---- //
  try {
    await page.locator('text=游戏').first().click({ timeout: 5000 });
    await page.waitForTimeout(900);
    await page.locator('li, [class*="item"], [class*="option"]', { hasText: /^科技/ }).first().click({ timeout: 4000 });
    await page.waitForTimeout(700);
    await page.locator('li, .bcc-option, [class*="option"]', { hasText: '人工智能' }).first().click({ timeout: 4000 });
    console.log('分区 = 科技/人工智能');
  } catch (e) {
    console.log('分区自动失败（人工兜底）:', e.message.slice(0, 80));
  }

  // ---- 6) 声明核验（已是 含AI生成内容 则只读）---- //
  const dv = await race(page.evaluate(() => {
    const el = document.querySelector('.bcc-select-input-inner, .bcc-select input, [class*="declare"] input');
    return el ? el.value : '(未读到)';
  }), 10000, 'read declare');
  console.log('声明当前值 =', dv);
  if (!String(dv).includes('AI')) {
    await page.locator('.bcc-select, [class*="declare"] .bcc-select').first().click();
    await page.waitForTimeout(700);
    await page.locator('li.bcc-option, [class*="option"]', { hasText: '含AI生成内容' }).first().click();
    console.log('声明已改为 含AI生成内容');
  }

  await shot(page, 4);
  await page.screenshot({ path: 'qa/pw-bili-final.png', fullPage: true });
  console.log('DONE — 人工核对 qa/pw-bili-final.png 后自己点「立即投稿」');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
