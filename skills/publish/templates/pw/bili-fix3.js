// bili-fix3.js — 定点修复 B 站表单三处：创作声明 / 分区二级 / 截图核对。不碰其他字段。
const { loadPlaywright, qaPath, race } = require('./util');

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => p.url().includes('member.bilibili.com'))
    ?? ctx.pages().find((p) => p.url().includes('bilibili.com'));
  if (!page) throw new Error('没找到 B 站页面');
  page.setDefaultTimeout(15000);
  await page.bringToFront();

  // ---- 1) 创作声明 → 含AI生成内容（读完输入框的值做验证，不轻信点击）---- //
  const declareBox = page.locator('.bcc-select, [class*="declare"] .bcc-select').first();
  await declareBox.click();
  await page.waitForTimeout(700);
  await page.locator('li.bcc-option, [class*="option"]', { hasText: '含AI生成内容' }).first().click();
  await page.waitForTimeout(700);
  const val = await race(page.evaluate(() => {
    const el = document.querySelector('.bcc-select-input-inner, .bcc-select input, [class*="declare"] input');
    return el ? el.value : (document.querySelector('[class*="declare"]')?.innerText || '').slice(0, 40);
  }), 10000, 'read declare value');
  console.log('声明当前值 =', val);
  if (!String(val).includes('AI')) {
    console.log('!! 声明仍未选上，需要人工点一下');
  }

  // ---- 2) 分区 → 科技 / 人工智能 ---- //
  try {
    await page.locator('text=科技数码').first().click({ timeout: 5000 });
    await page.waitForTimeout(900);
    // 一级面板里点「科技」，二级里点「人工智能」；顺序可能同屏，都试
    const keeji = page.locator('li, [class*="item"], [class*="option"]', { hasText: /^科技/ }).first();
    await keeji.click({ timeout: 4000 });
    await page.waitForTimeout(700);
    await page.locator('li, .bcc-option, [class*="option"]', { hasText: '人工智能' }).first().click({ timeout: 4000 });
    await page.waitForTimeout(600);
    const cat = await race(page.evaluate(() => {
      const el = [...document.querySelectorAll('input')].find((e) => /科技|人工智能|绘画|数码/.test(e.value || ''));
      return el ? el.value : '未读到';
    }), 10000, 'read category');
    console.log('分区当前值 =', cat);
  } catch (e) {
    console.log('分区修复失败（人工兜底）：', e.message.slice(0, 100));
  }

  await page.screenshot({ path: qaPath('pw-bili-fixed.png'), fullPage: false });
  console.log('DONE — qa/pw-bili-fixed.png（项目 qa/ 目录）');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
