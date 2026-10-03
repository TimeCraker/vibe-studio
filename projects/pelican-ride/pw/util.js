// pw/util.js — Playwright 发布脚本的公共件。
// Playwright 复用 hsr-currency-war/pw 里已装好的包（不重复安装，不下载浏览器）；
// 后续若正式收录进 skills/publish，再挪依赖位置。
const path = require('path');
const FS = require('fs');

function loadPlaywright() {
  try {
    return require(path.join(__dirname, '..', '..', 'hsr-currency-war', 'pw', 'node_modules', 'playwright'));
  } catch (e) {
    throw new Error('找不到 playwright 包：期望在 ../../hsr-currency-war/pw/node_modules（' + e.message + '）');
  }
}

const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};
const hasFlag = (k) => process.argv.includes('--' + k);

const ROOT = path.join(__dirname, '..');
const loadSpec = (name) => JSON.parse(FS.readFileSync(path.join(ROOT, name), 'utf8'));

/** 把视频/封面塞进页面上的所有 file input（浏览器本地读取，无大小限制），
 *  返回第一个触发上传成功的 input 序号。判定：页面文本出现上传中/百分数。 */
async function setFiles(page, ctx, files, probeRe) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('DOM.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type=file]' });
  console.log('file inputs:', nodeIds.length);
  for (const nid of nodeIds) {
    await cdp.send('DOM.setFileInputFiles', { files, nodeId: nid });
    await page.waitForTimeout(2000);
    const hit = await page.evaluate((re) => re.test(document.body.innerText), probeRe.source);
    console.log(`  input[${nid}]: uploading=${hit}`);
    if (hit) return nid;
  }
  return null;
}

/** 现场探针：表单选择器失败时转储候选元素，人看着真实 DOM 再改脚本。 */
async function dumpForm(page, tag) {
  const info = await page.evaluate(() => ({
    url: location.href.slice(0, 120),
    inputs: [...document.querySelectorAll('input,textarea')]
      .filter((e) => e.getBoundingClientRect().width > 0)
      .map((e) => ({ tag: e.tagName, type: e.type, ph: e.getAttribute('placeholder'), cls: (e.className || '').toString().slice(0, 60), id: e.id }))
      .slice(0, 24),
    editors: [...document.querySelectorAll('[contenteditable="true"]')]
      .map((e) => ({ cls: (e.className || '').toString().slice(0, 70), ph: e.getAttribute('data-placeholder') || e.getAttribute('aria-label') || '' })),
    buttons: [...document.querySelectorAll('button')]
      .filter((e) => e.getBoundingClientRect().width > 0)
      .map((e) => (e.innerText || '').trim().slice(0, 14))
      .filter(Boolean)
      .slice(0, 24),
  }));
  console.log(`FORM PROBE [${tag}]:\n` + JSON.stringify(info, null, 1));
  return info;
}

/** 逐段输入富文本（editor-kit / TipTap / Quill 通吃：只聚焦，不碰选区）。 */
async function typeParagraphs(page, editor, paragraphs) {
  await editor.click();
  for (let i = 0; i < paragraphs.length; i++) {
    if (i > 0) await page.keyboard.press('Enter');
    await page.keyboard.insertText(paragraphs[i]);
    await page.waitForTimeout(280);
  }
}

/** 全页自查截图（qa/pw-<tag>.png），人看完自己点发布。 */
async function selfCheck(page, tag) {
  const out = path.join(__dirname, '..', 'qa', `pw-${tag}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`自查截图: ${out}`);
  console.log('READY — 看图确认后，发布按钮请自己点（脚本永远不点）。');
}

module.exports = { loadPlaywright, arg, hasFlag, ROOT, loadSpec, setFiles, dumpForm, typeParagraphs, selfCheck };
