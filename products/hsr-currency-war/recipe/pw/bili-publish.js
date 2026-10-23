// bili-publish.js — Playwright 连接已登录的 B 站 Chrome（CDP 9222），完成声明选择并发布。
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('member.bilibili.com'));
  if (!page) throw new Error('没找到 B 站投稿页');
  await page.bringToFront();

  // 1) 创作声明：点开下拉，等动画稳定，按文本点选项（Playwright 自动等待可点状态）
  await page.click('.bcc-select');
  const opt = page.locator('li.bcc-option', { hasText: '含AI生成内容' }).first();
  await opt.click();
  await page.waitForTimeout(600);
  const val = await page.$eval('.bcc-select-input-inner', el => el.value);
  console.log('declaration =', val);
  if (val !== '含AI生成内容') {
    await page.screenshot({ path: 'qa/pw-declare-fail.png' });
    throw new Error('声明未选上，中止发布');
  }

  // 2) 发布前自查截图
  await page.screenshot({ path: 'qa/pw-pre-publish.png', fullPage: true });

  // 3) 点「立即投稿」
  const btn = page.locator('button', { hasText: '立即投稿' }).first();
  await btn.click();
  console.log('已点击 立即投稿，等待结果…');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'qa/pw-post-publish.png', fullPage: true });
  const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 400);
  console.log('page text head:', bodyText.replace(/\n+/g, ' | ').slice(0, 300));
  console.log('DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
