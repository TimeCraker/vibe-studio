import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(join(project,p),'utf8'));
const write=(p,o)=>writeFileSync(join(project,p),JSON.stringify(o,null,2)+'\n');
const review=read('audio/recording-review.json');
const sha=createHash('sha256').update(readFileSync(join(project,review.source))).digest('hex');
if(sha!==review.sourceSha256)throw Error('Recording changed: redo ASR and review, do not reuse old timings');
const edition=read('edition.json');const fps=60, intro=edition.rankingSeconds*2;
const definitions=[
 ['overview','今日资讯总览',['kimi-launch','harness-method','voice-features']],
 ['kimi-title','Kimi K3.1 Pro',['kimi-launch']],['kimi-bench','终端任务评测',['kimi-terminal']],
 ['kimi-creative','游戏与三维创作',['kimi-creative']],['kimi-access','使用入口与权重',['kimi-access']],
 ['harness','Harness²智能体研究',['harness-method','harness-components']],
 ['harness-use','研究框架与开发者用途',['harness-components']],['voice','开源语音项目VoiceStudio',['voice-features']],
 ['voice-api','本地接口与使用条件',['voice-features']],['close','本期资讯结束',['kimi-access','harness-method','voice-features']],
];
const voiceLength=review.sourceOut-review.sourceIn;
const frames=Math.ceil((intro+voiceLength+1)*fps);const seconds=frames/fps;
const cues=review.cues.map((c,i)=>({id:i+1,scene:c.scene,text:c.text,
 from:Math.round((intro+c.start-review.sourceIn)*fps),to:Math.round((intro+c.end-review.sourceIn)*fps)}));
const boundaries=definitions.map(([id],i)=>{
 const group=review.cues.filter(c=>c.scene===id);if(!group.length)throw Error(`Missing scene ${id}`);
 if(!i)return intro;
 const previous=review.cues.filter(c=>c.scene===definitions[i-1][0]).at(-1);
 return Math.round((intro+(previous.end+group[0].start)/2-review.sourceIn)*fps)/fps;
});
const scenes=[
 {id:'global',start:0,end:edition.rankingSeconds,title:'全球综合智力 TOP15',purpose:'原榜与官方图标，BGM开场',subject:'当期全球ECI前15',claimIds:['ranking']},
 {id:'domestic',start:edition.rankingSeconds,end:intro,title:'国产综合智力 TOP15',purpose:'与全球榜平齐，BGM开场',subject:'当期国产ECI前15',claimIds:['ranking']},
 ...definitions.map(([id,title,claimIds],i)=>({id,start:boundaries[i],end:boundaries[i+1]??seconds,title,
 purpose:'按实际语音推进，相关官方图片与数据支撑正文',subject:title,claimIds})),
];
for(const [i,c] of cues.entries()){
 if(c.from<0||c.to<=c.from||c.to>frames||(i&&c.from<cues[i-1].to))throw Error('Invalid subtitle windows');
 const scene=scenes.find(s=>s.id===c.scene);if(c.from/60<scene.start-.02||c.to/60>scene.end+.02)throw Error(`Cue crosses scene ${c.scene}`);
}
write('timeline.json',{date:edition.date,fps,width:1920,height:1080,durationInFrames:frames,seconds,
 voice:'human-recorded',timingMode:'faster-whisper-word-windows-text-reviewed-listening-pending',recording:review.source,
 recordingSha256:sha,scenes,cues});
write('script.json',{meta:{title:'2026年10月24日每日AI资讯 真人口播',lang:'zh-CN',budgetSeconds:voiceLength,
 charsPerSecond:5.8,bannedWords:[]},segments:cues.map(c=>({id:c.id,kind:'subtitle',text:c.text,ref:`scene ${c.scene}`}))});
const fmt=s=>{const t=Math.round(s*1000);return `${String(Math.floor(t/3600000)).padStart(2,'0')}:${String(Math.floor(t/60000)%60).padStart(2,'0')}:${String(Math.floor(t/1000)%60).padStart(2,'0')},${String(t%1000).padStart(3,'0')}`;};
writeFileSync(join(project,'captions.srt'),cues.map((c,i)=>`${i+1}\n${fmt(c.from/fps)} --> ${fmt(c.to/fps)}\n${c.text}\n`).join('\n'));
write('captions.cues.json',{subtitles:cues.map(c=>({start:Number((c.from/fps).toFixed(3)),end:Number((c.to/fps).toFixed(3)),text:c.text}))});
write('storyboard.json',{schemaVersion:1,audience:'关注AI模型与开发工具的创作者、独立开发者',goal:'了解Kimi新模型与两项工具观察',
 profile:'data',claims:read('claims.json'),scenes,review:{status:'pending',note:'采用用户真人录音；技术与ASR不代表听感或人工接受'}});
write('qc.json',{width:1920,height:1080,fps,duration:seconds});
write('audio-voice.json',{schemaVersion:1,duration:voiceLength,target:{integrated:-18,truePeak:-2,range:9},ducking:false,
 tracks:[{file:review.source,role:'voice',in:review.sourceIn,duration:voiceLength,fadeIn:.03,fadeOut:.08}]});
write('audio.json',{schemaVersion:1,duration:seconds,target:{integrated:-16,truePeak:-1.5,range:11},
 ducking:{threshold:.03,ratio:6,attack:12,release:280},tracks:[
 {file:'audio/voice-clean.wav',role:'voice',start:intro,duration:voiceLength},
 {file:'assets/carefree.mp3',role:'music',duration:intro+.5,gainDb:-4,fadeIn:1,fadeOut:1},
 {file:'assets/carefree.mp3',role:'music',start:intro-.5,in:intro-.5,duration:seconds-(intro-.5),gainDb:-11,fadeIn:1,fadeOut:1.5},
 ]});
// Do not write narration.md: it is the manuscript handed to the human reader.
copyFileSync(join(project,'assets/voice-workspace.png'),join(project,'remotion-app/public/edition/assets/voice-workspace.png'));
console.log(JSON.stringify({seconds,frames,scenes:scenes.length,captions:cues.length,sourceSha256:sha,voice:'human-recorded'}));
