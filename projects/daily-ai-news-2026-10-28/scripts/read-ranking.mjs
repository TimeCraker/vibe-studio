import {createRequire} from 'node:module';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve, join} from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('C:/Users/TimeCraker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const {chromium} = require('playwright');
mkdirSync(join(root, 'qa'), {recursive:true});
const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page = await browser.newPage({viewport:{width:1440,height:1000}});
try {
  await page.goto('https://www.bilibili.com/toy/ai-model-world', {waitUntil:'domcontentloaded',timeout:60000});
  // Bilibili's live DOM rewrites the frame src through its wrapper domain.
  // Discover the canonical embed from this request's preserved HTTP response.
  const records = JSON.parse(readFileSync(join(root,'evidence/retrieval.json'),'utf8'));
  const iframe = records.find(record=>record.id==='bilibili-entry')?.media?.find(frame=>frame.src?.includes('bilibilitoy'))?.src;
  if (!iframe) throw Error('Current Bilibili iframe was not discovered');
  const embeddedUrl = new URL(iframe, page.url()).href;
  // The toy redirects top-level visits back to its wrapper. Keep it in the
  // publisher's iframe, where the actual ranking UI is intended to run.
  const target = page.frameLocator('iframe[src*="bilibilitoy"]');
  await target.getByRole('link',{name:'排行榜',exact:true}).click();
  await target.getByRole('button',{name:'国内',exact:true}).waitFor();
  const evidence = {entryUrl:'https://www.bilibili.com/toy/ai-model-world',embeddedUrl,leaderboardUrl:new URL('leaderboard/index.html',embeddedUrl).href,observations:[]};
  for (const [kind, label] of [['global','全部'],['domestic','国内']]) {
    await target.getByRole('button',{name:label,exact:true}).first().click();
    const body = await target.locator('body').innerText();
    const rows = await target.locator('ol li').evaluateAll(nodes=>nodes.map(node=>({text:node.innerText,links:Array.from(node.querySelectorAll('a')).map(a=>({text:a.innerText,href:a.getAttribute('href')}))})));
    const selected = await target.locator('select').evaluateAll(nodes=>nodes.map(node=>({value:node.value,text:node.selectedOptions[0]?.textContent})));
    const buttons = await target.locator('button[aria-pressed="true"]').allTextContents();
    writeFileSync(join(root,`evidence/ranking-live-${kind}.txt`),body,'utf8');
    await page.screenshot({path:join(root,`qa/ranking-live-${kind}.png`),fullPage:true});
    evidence.observations.push({kind,filter:label,queriedAt:new Date().toISOString(),selected,pressedButtons:buttons,rows});
    console.log(JSON.stringify({kind,rows:rows.slice(0,3),bodyStart:body.slice(body.indexOf('综合智力'),body.indexOf('综合智力')+1600)}));
  }
  writeFileSync(join(root,'evidence/ranking-live.json'),JSON.stringify(evidence,null,2)+'\n');
} catch(error) {
  writeFileSync(join(root,'qa/ranking-browser-failure.json'),JSON.stringify({url:page.url(),error:error.message,title:await page.title(),body:(await page.locator('body').innerText()).slice(0,5000)},null,2));
  await page.screenshot({path:join(root,'qa/ranking-browser-failure.png'),fullPage:true});
  throw error;
} finally {await browser.close();}
