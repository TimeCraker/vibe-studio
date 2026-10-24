import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>JSON.parse(readFileSync(join(project,p),'utf8'));
const write=(p,o)=>{mkdirSync(dirname(join(project,p)),{recursive:true});writeFileSync(join(project,p),JSON.stringify(o,null,2)+'\n');};
const edition=read('edition.json');
const rankSeconds=edition.rankingSeconds;const cps=edition.previewCharsPerSecond;
const snapshot=read('evidence/models.json');
const vendor=new Map(snapshot.vendors.map(v=>[v.id,v]));
const rows=snapshot.models.filter(m=>!m.retiredAt&&Number.isFinite(m.benchmarks.eci)).sort((a,b)=>b.benchmarks.eci-a.benchmarks.eci||a.id.localeCompare(b.id));
const icons={anthropic:'claude.png',openai:'openai.svg',google:'google.png',meta:'meta.svg',moonshotai:'kimi.png',alibaba:'qwen.png',zhipuai:'glm.svg',deepseek:'deepseek.ico'};
const pack=(rs)=>rs.slice(0,15).map((m,i)=>{if(!icons[m.vendorId])throw Error(`Missing official icon: ${m.vendorId}`);return {rank:i+1,id:m.id,name:m.name,eci:m.benchmarks.eci,vendor:m.vendorId,icon:icons[m.vendorId],country:vendor.get(m.vendorId)?.country};});
// The current site's 国内 filter uses the source vendor region. Verify it against CN.
const domestic=rows.filter(m=>vendor.get(m.vendorId)?.continent==='east');
if(domestic.some(m=>vendor.get(m.vendorId)?.country!=='CN'))throw Error('Review domestic definition before rendering');
const rawHash=createHash('sha256').update(readFileSync(join(project,'evidence/models.json'))).digest('hex');
const ranking={date:edition.date,metric:'Epoch Capabilities Index / ECI',generatedAt:snapshot.generatedAt,generatedAtShanghai:new Date(snapshot.generatedAt).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}),sourceUrl:'https://raw.githubusercontent.com/liyupi/ai-model-world/main/data/models.json',entryUrl:'https://www.bilibili.com/toy/ai-model-world',sha256:rawHash,scope:'Live Bilibili global and 国内 top15 observed; raw upstream values used for two decimal places. Stable score-desc/id order, no retirement, no missing-score imputation.',global:pack(rows),domestic:pack(domestic)};
write('ranking.json',ranking);
const scenes=[{id:'global',start:0,end:rankSeconds,title:'全球综合智力 TOP15',purpose:'完整榜单，前三突出，所有行显示官方厂商图标',subject:'当期 ECI 全球排名',claimIds:['ranking']},{id:'domestic',start:rankSeconds,end:rankSeconds*2,title:'国产综合智力 TOP15',purpose:'与全球榜平齐排版，不合并不同模型版本',subject:'同源 ECI 国内排名',claimIds:['ranking']}];
const cues=[];const segments=[];let t=rankSeconds*2;let id=1;
for(const [i,story] of edition.stories.entries()){
 const weights=story.lines.map(text=>Math.max(1.65,[...text.replace(/[\s，。！？、,.]/g,'')].length/cps));
 const seconds=Math.max(story.minimumSeconds,Math.ceil(weights.reduce((a,b)=>a+b,0)+.7));
 const start=t;const available=seconds-.7;const total=weights.reduce((a,b)=>a+b,0);let local=.3;
 story.lines.forEach((text,j)=>{const span=weights[j]/total*available;const from=Math.round((t+local)*60);const to=Math.round((t+local+span-.1)*60);cues.push({id,scene:story.id,text,from,to});segments.push({id:id++,kind:'subtitle',text,ref:`page ${i+1}`});local+=span;});
 t+=seconds;scenes.push({id:story.id,start,end:t,title:story.title,purpose:'按讲述语义分层，图解和真实素材支撑信息',subject:story.title,claimIds:story.claimIds});
}
const timeline={date:edition.date,fps:60,width:1920,height:1080,durationInFrames:t*60,seconds:t,voice:'human-pending',timingMode:edition.subtitleTiming,scenes,cues};
write('timeline.json',timeline);write('script.json',{meta:{title:'2026年10月24日每日AI资讯',lang:'zh-CN',budgetSeconds:t-rankSeconds*2,charsPerSecond:cps,bannedWords:[]},segments});
const format=(seconds)=>{const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
writeFileSync(join(project,'captions-preview.srt'),cues.map((c,i)=>`${i+1}\n${format(c.from/60)} --> ${format(c.to/60)}\n${c.text}\n`).join('\n'));
const doc=['# 2026年10月24日口播稿','', `前${rankSeconds*2}秒是全球与国产 TOP15，只放BGM，不必朗读榜单。${rankSeconds*2}秒后开始。本次按你偏快的语速粗排，参考每秒${cps}个可见字符；时间仅供预览，录音不用追秒。按段自然念，每段之间稍停，后期按你的录音重新定剪辑和字幕。`,'', '读法：Kimi 读 kimi；K3.1 Pro 可读 K 三点一 Pro；token 可读 token；Godot 可读 戈多；Harness² 读 Harness 平方；API 读字母。原名保留在画面。',''];
for(const s of edition.stories){const scene=scenes.find(x=>x.id===s.id);doc.push(`## ${s.title}（预览 ${scene.start} 至 ${scene.end} 秒）`,'',s.lines.join(''),'');}
doc.push('## 录音交付','', '可以一口气录完整稿，也可以按上面九段分别录。保留干声，不在录音里另加BGM，不需要念时间、标题和来源。录音后替换预览节奏，重新对齐字幕；本版未使用TTS、未做ASR。','');
writeFileSync(join(project,'narration.md'),doc.join('\n'));
const claims=read('claims.json');write('storyboard.json',{schemaVersion:1,audience:'关注AI模型与开发工具的创作者、独立开发者',goal:'了解K3.1 Pro实际变化、可用时间与两个工具的用途',profile:'data',claims,scenes,review:{status:'pending',note:'Previous episode visual direction accepted; this episode and human voice pending.'}});
write('qc.json',{width:1920,height:1080,fps:60,duration:t});
write('audio.json',{schemaVersion:1,duration:t,normalize:false,ducking:false,tracks:[{file:'assets/carefree.mp3',role:'music',duration:rankSeconds*2+.5,gainDb:-2,fadeIn:1,fadeOut:1},{file:'assets/carefree.mp3',role:'music',start:rankSeconds*2-.5,in:rankSeconds*2-.5,duration:t-(rankSeconds*2-.5),gainDb:-7,fadeIn:1,fadeOut:2}]});
const publicRoot=join(project,'remotion-app/public/edition');mkdirSync(join(publicRoot,'assets'),{recursive:true});mkdirSync(join(publicRoot,'fonts'),{recursive:true});
const assetManifest=read('assets/sources.json');for(const x of assetManifest){if(x.error)throw Error(x.error);if(!existsSync(join(project,x.file)))throw Error(`Missing ${x.file}`);copyFileSync(join(project,x.file),join(publicRoot,x.file));}
for(const [name,destination] of [['NotoSansSC-VF.ttf','sans.ttf'],['consola.ttf','mono.ttf']])copyFileSync(join(process.env.WINDIR||'C:/Windows','Fonts',name),join(publicRoot,'fonts',destination));
console.log(JSON.stringify({seconds:t,frames:t*60,scenes:scenes.length,captions:cues.length,voice:'human-pending'}));
