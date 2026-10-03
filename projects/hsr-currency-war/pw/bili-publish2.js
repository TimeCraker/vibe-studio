// bili-publish2.js — 声明选择 + 发布前自查 + 点「立即投稿」+ 结果验证
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('member.bilibili.com'));
  if (!page) throw new Error('没找到 B 站投稿页');
  await page.bringToFront();

  // 1) 创作声明
  await page.click('.bcc-select');
  await page.locator('li.bcc-option', { hasText: '含AI生成内容' }).first().click();
  await page.waitForTimeout(800);
  const val = await page.$eval('.bcc-select-input-inner', el => el.value);
  console.log('declaration =', val);
  if (val !== '含AI生成内容') { await page.screenshot({ path: '../qa/pw2-declare-fail.png' }); throw new Error('声明未选上，中止'); }

  // 2) 发布前自查：关键字段断言 + 截图
  const state = await page.evaluate(() => ({
    title: (document.querySelector('input[type=text]')?.value ?? '').slice(0, 30),
    descLen: (document.querySelector('.ql-editor, [class*=editor]')?.innerText ?? '').length,
  }));
  console.log('pre-publish state:', JSON.stringify(state));
  await page.screenshot({ path: '../qa/pw2-pre-publish.png', fullPage: true });

  // 3) 点「立即投稿」（用坐标兜底：先试文本定位，失败则用截图坐标区）
  const btn = page.locator('button:visible', { hasText: '立即投稿' }).first();
  try {
    await btn.click({ timeout: 8000 });
    console.log('已点击 立即投稿');
  } catch {
    console.log('文本定位失败，改用坐标点击');
    const b = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && (e.innerText || '').trim() === '立即投稿');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (!b) throw new Error('找不到立即投稿');
    await page.mouse.click(b.x, b.y);
  }

  // 4) 等结果（成功弹窗/页面跳转）
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '../qa/pw2-post-publish.png', fullPage: true });
  const after = page.url();
  const bodyHead = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 260);
  console.log('url after:', after.slice(0, 90));
  console.log('body head:', bodyHead);
  console.log('DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
