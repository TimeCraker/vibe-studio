// dy-upload.js — 上传竖版视频并等待发布表单出现（文件走 CDP 直设，绕过 50MB 传输限制）
const { chromium } = require('playwright');
const path = require('path');

const VIDEO = path.resolve(process.argv[2]);
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', { timeout: 20000 });
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('creator.douyin.com'));
  await page.bringToFront();
  if (!page.url().includes('content/upload')) {
    await page.goto('https://creator.douyin.com/creator-micro/content/upload', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
  }
  // CDP 会话：直接对 input[type=file] 设文件（浏览器本地读取，无大小限制）
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type=file]' });
  console.log('file inputs:', nodeIds.length);
  for (const nid of nodeIds) {
    await cdp.send('DOM.setFileInputFiles', { files: [VIDEO], nodeId: nid });
    await page.waitForTimeout(2000);
    const check = await page.evaluate(() => /上传中|%|重新上传|上传完成/.test(document.body.innerText));
    console.log(`input[${nid}]: uploading=${check}`);
    if (check) break;
  }

  // 等待表单：标题输入框出现（上传完成）
  await page.waitForSelector('input[placeholder*="标题"]', { timeout: 300000 });
  await page.waitForTimeout(3000);
  const probe = await page.evaluate(() => ({
    url: location.href.slice(0, 90),
    titleInput: !!document.querySelector('input[placeholder*="标题"]'),
    editors: [...document.querySelectorAll('[contenteditable="true"]')].map(e => ({ cls: (e.className || '').slice(0, 70), ph: e.getAttribute('data-placeholder') || '' })),
    declared: /内容由AI生成/.test(document.body.innerText),
    bodyHead: document.body.innerText.replace(/\s+/g, ' ').slice(0, 150),
  }));
  console.log('FORM:' + JSON.stringify(probe, null, 1));
})().catch(e => { console.error('ERR', e.message.slice(0, 250)); process.exit(1); });
