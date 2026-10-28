// Repair the declaration through the same checked operation as the main driver.
const {loadPlaywright, qaPath} = require('./util');
const {selectDouyinDeclaration} = require('./form-actions');

(async () => {
  const {chromium} = loadPlaywright();
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223', {timeout:20000});
  const page = browser.contexts()[0].pages().find(p => p.url().includes('creator.douyin.com'));
  if (!page) throw Error('没找到抖音页面');
  page.setDefaultTimeout(10000);
  await selectDouyinDeclaration(page, '内容由AI生成');
  await page.screenshot({path:qaPath('pw-douyin-fixed.png'),fullPage:false});
  console.log('声明已回读验证；最终发布仍由用户点击');
})().then(() => process.exit(0)).catch(e => {
  console.error('ERR',e.message);
  process.exit(1);
});
