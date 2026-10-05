// bili-restore.js — 点「继续编辑」恢复草稿，截图并打印关键字段现状
const { loadPlaywright, race } = require('./util');

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => p.url().includes('member.bilibili.com'));
  if (!page) throw new Error('没找到投稿页');
  page.setDefaultTimeout(15000);

  await race(page.locator('text=继续编辑').first().click({ timeout: 10000 }), 15000, 'click 继续编辑');
  await page.waitForTimeout(4000);

  const state = await race(page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q('input[placeholder*="标题"], .bcc-input-inner, #title-input input');
    const editor = q('.ql-editor[contenteditable="true"]');
    const val = (el) => (el ? (el.value || el.innerText || '').slice(0, 60) : '(无)');
    const tags = [...document.querySelectorAll('[class*="tag"] [class*="text"], .bcc-tag, [class*="tag-item"]')]
      .map((e) => (e.innerText || '').trim()).filter((t) => t && t.length < 12).slice(0, 12);
    const declare = q('.bcc-select-input-inner, .bcc-select input, [class*="declare"] input');
    const cat = [...document.querySelectorAll('input')].find((e) => /科技|人工智能|绘画|数码/.test(e.value || ''));
    const video = /上传完成/.test(document.body.innerText);
    return {
      title: title ? val(title) : '(无标题框)',
      body: editor ? val(editor) : '(无编辑器)',
      tags, declare: declare ? val(declare) : '(无声明框)',
      category: cat ? cat.value : '(未读到)',
      videoUploaded: video,
    };
  }), 15000, 'restore state');

  console.log(JSON.stringify(state, null, 1));
  await page.screenshot({ path: 'qa/pw-bili-restored.png', fullPage: false });
  console.log('DONE — qa/pw-bili-restored.png');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
