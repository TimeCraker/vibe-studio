// Real local-browser regressions. Never connects to a creator account or upload site.
import assert from 'node:assert/strict';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, join} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('../skills/publish/templates/node_modules/playwright');
const {typeParagraphs,setFiles}=require('../skills/publish/templates/pw/util.js');
const {appendTopics,assertDescription,selectDouyinDeclaration,selectXhsDeclaration,uploadBiliVideo}=require('../skills/publish/templates/pw/form-actions.js');
const candidates=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
const executablePath=candidates.find(existsSync);
if(!executablePath) throw Error('Local Chrome/Edge not found; set CHROME_PATH for this browser regression');
const out=resolve('.cache/publish-browser-regression');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath,headless:true});
const page=await browser.newPage();page.setDefaultTimeout(4000);
const body=['本期说明','来源：https://epoch.ai/eci','音乐：作者与许可 https://example.invalid/license'];
let assertions=0;
try {
  await page.setContent(`<div id="editor" contenteditable="true" style="width:800px;min-height:180px;border:1px solid"><p><br></p></div><div class="mention-suggest-mount-dom" style="display:none"><div role="option"></div></div><script>
    const ed=document.querySelector('#editor'), menu=document.querySelector('.mention-suggest-mount-dom'),option=menu.firstElementChild;
    window.unrelated=false;ed.addEventListener('input',()=>{const m=ed.innerText.match(/#([^#\\s]+)$/);if(m){menu.style.display='block';option.innerText=window.unrelated?'#无关推荐':'#'+m[1];}else menu.style.display='none';});
    option.addEventListener('mousedown',e=>e.preventDefault());option.addEventListener('click',()=>menu.style.display='none');
  </script>`);
  const editor=page.locator('#editor');
  await typeParagraphs(page,editor,body);
  // Reproduce the old wrong-caret trigger before using the repaired helper.
  await editor.click({position:{x:80,y:25}});
  const good=await appendTopics(page,editor,body,['大模型'],'douyin',()=>typeParagraphs(page,editor,body));
  assert.deepEqual(good.topicsApplied,['大模型']);await assertDescription(editor,body,['大模型']);assertions++;
  await typeParagraphs(page,editor,body);await page.evaluate(()=>window.unrelated=true);
  const absent=await appendTopics(page,editor,body,['AI资讯'],'douyin',()=>typeParagraphs(page,editor,body));
  assert.deepEqual(absent.topicsApplied,[]);assert.deepEqual(absent.topicsPending,['AI资讯']);await assertDescription(editor,body);assertions++;
  await editor.fill('来源：https #大模型 ://epoch.ai/eci');
  await assert.rejects(()=>assertDescription(editor,body),/readback mismatch/);assertions++;

  await page.setContent(`<div><span>自主声明</span><div class="selectBox">请选择</div></div><div class="semi-modal" style="display:none"><label class="semi-radio"><input type="radio" name="ai">内容由AI生成</label><button disabled>确定</button></div><script>
    const modal=document.querySelector('.semi-modal'),box=document.querySelector('.selectBox'),radio=document.querySelector('input'),button=document.querySelector('button');
    box.onclick=()=>modal.style.display='block';radio.onchange=()=>button.disabled=!radio.checked;button.onclick=()=>{box.innerText='内容由AI生成';modal.style.display='none'};
  </script>`);
  assert.equal(await selectDouyinDeclaration(page,'内容由AI生成'),true);assertions++;
  await page.setContent(`<div><span>自主声明</span><div class="selectBox">请选择</div></div><div class="semi-modal"><label class="semi-radio" onclick="event.preventDefault()"><input type="radio">内容由AI生成</label><button disabled>确定</button></div>`);
  await assert.rejects(()=>selectDouyinDeclaration(page,'内容由AI生成'),/not selected/);assertions++;

  await page.setContent(`<div><span>添加内容类型声明</span><select><option>请选择</option><option>笔记含AI合成内容</option></select></div><label>声明原创<input id="original" type="checkbox"></label>`);
  assert.equal(await selectXhsDeclaration(page,'笔记含AI合成内容'),true);
  assert.equal(await page.locator('select').inputValue(),'笔记含AI合成内容');assert.equal(await page.locator('#original').isChecked(),false);assertions++;

  const file=join(out,'fixture.mp4');writeFileSync(file,'file chooser fixture, no remote upload');
  await page.setContent(`<div class="bcc-upload-wrapper"><div class="upload-area"><div class="upload-btn no-events" style="pointer-events:none">上传视频</div></div></div><input type="file" id="video" accept="video/*" hidden><script>document.querySelector('.upload-area').onclick=()=>document.querySelector('#video').click()</script>`);
  await uploadBiliVideo(page,file);assert.equal(await page.locator('#video').evaluate(e=>e.files[0].name),'fixture.mp4');assertions++;
  await page.setContent(`<input type="file" accept="image/*" id="cover"><input type="file" accept="video/*" id="video"><div id="state"></div><script>document.querySelector('#video').onchange=()=>document.querySelector('#state').innerText='上传完成'</script>`);
  await setFiles(page,null,[file],/上传完成/);assert.equal(await page.locator('#cover').evaluate(e=>e.files.length),0);assertions++;
  const report={assertions,scope:'local browser fixtures only; no creator site or publishing',passed:true};
  writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await browser.close();}
