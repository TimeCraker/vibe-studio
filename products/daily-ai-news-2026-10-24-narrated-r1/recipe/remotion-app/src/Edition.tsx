import React, {useEffect,useState} from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill,Audio,Composition,Still,Easing,Img,Sequence,cancelRender,continueRender,delayRender,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import timeline from '../../timeline.json';
import ranking from '../../ranking.json';
import edition from '../../edition.json';

const C={paper:'#f5f4ef',white:'#fbfaf6',ink:'#191a17',coral:'#a8513c',muted:'#72736a',line:'#c9c9bf',wash:'#e9e4da'};
const sans="'DailySC', sans-serif";const mono="'DailyMono', monospace";
const xy=(left:number,top:number,width?:number,height?:number):React.CSSProperties=>({position:'absolute',left,top,width,height});
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)} as const;
const asset=(file:string)=>staticFile(`edition/assets/${file}`);
type Scene=typeof timeline.scenes[number];
let fonts:Promise<unknown>|undefined;
const FontGate:React.FC<React.PropsWithChildren>=({children})=>{
 const [handle]=useState(()=>delayRender('edition local fonts'));
 useEffect(()=>{fonts??=Promise.all([loadFont({family:'DailySC',url:staticFile('edition/fonts/sans.ttf'),weight:'100 900'}),loadFont({family:'DailyMono',url:staticFile('edition/fonts/mono.ttf')})]);fonts.then(()=>continueRender(handle)).catch(cancelRender);},[handle]);return <>{children}</>;
};
const Reveal:React.FC<React.PropsWithChildren<{at?:number;style?:React.CSSProperties}>>=({children,at=0,style})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();return <div style={{...style,opacity:interpolate(f,[at*fps,(at+.5)*fps],[0,1],clamp),transform:`translateY(${interpolate(f,[at*fps,(at+.6)*fps],[24,0],clamp)}px)`}}>{children}</div>;
};
const Logo:React.FC<{file:string;size?:number}>=({file,size=48})=><Img src={asset(file)} style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>;
const Label:React.FC<React.PropsWithChildren<{top?:number}>>=({children,top=157})=><div style={{...xy(76,top),fontFamily:mono,fontSize:23,letterSpacing:1.2,color:C.coral}}>{children}</div>;
const Title:React.FC<React.PropsWithChildren<{size?:number;top?:number}>>=({children,size=86,top=213})=><Reveal style={{...xy(72,top,1776),fontSize:size,lineHeight:1.13,fontWeight:850,letterSpacing:-3}}>{children}</Reveal>;
const Progress:React.FC<{seconds:number}>=({seconds})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return <div style={{...xy(72,978,1776,2),background:C.coral,transformOrigin:'left',transform:`scaleX(${Math.min(1,f/(seconds*fps))})`}}/>;};
const Page:React.FC<React.PropsWithChildren<{section:string;source:string;seconds:number}>>=({children,section,source,seconds})=><AbsoluteFill style={{fontFamily:sans,color:C.ink,background:C.paper,overflow:'hidden',fontWeight:450}}>
 <div style={{position:'absolute',inset:28,border:`1px solid ${C.line}`}}/>
 <div style={{...xy(72,48,1776,68),display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.line}`}}><div style={{display:'flex',alignItems:'center',gap:17}}><span style={{background:C.coral,width:17,height:17}}/><span style={{fontSize:34,fontWeight:850}}>每日 AI</span><span style={{fontFamily:mono,color:C.muted,fontSize:21,marginLeft:30}}>2026.10.24 / SAT</span></div><span style={{fontSize:22,color:C.muted}}>{section}</span></div>
 {children}<div style={{...xy(72,978,1776,1),background:C.line}}/><Progress seconds={seconds}/><div style={{...xy(72,997,1776),fontSize:18,color:C.muted,display:'flex',justifyContent:'space-between',gap:28}}><span>{source}</span><span style={{whiteSpace:'nowrap'}}>DAILY AI / 02</span></div>
</AbsoluteFill>;
const sceneFor=(id:string)=>timeline.scenes.find(s=>s.id===id)!;
const cueAt=(id:string,i:number)=>{const cue=timeline.cues.filter(c=>c.scene===id)[i];return cue?cue.from/60-sceneFor(id).start:0;};
const spokenAt=(id:string,pattern:RegExp,fallback=.2)=>{const cue=timeline.cues.find(c=>c.scene===id&&pattern.test(c.text));return cue?cue.from/60-sceneFor(id).start:fallback;};

const Ranking:React.FC<{domestic?:boolean}>=({domestic=false})=>{
 const rows=domestic?ranking.domestic:ranking.global;return <Page section={domestic?'00 / 国产模型':'00 / 全球模型'} seconds={edition.rankingSeconds} source={`大模型世界 / Epoch AI（CC BY 4.0）· 数据生成于 ${ranking.generatedAtShanghai} 北京时间`}>
  <Title size={99} top={153}>{domestic?'国产':'全球'} AI 模型综合智力 TOP 15</Title>
  <div style={{...xy(77,282),fontSize:25,fontFamily:mono,color:C.muted,letterSpacing:1.3}}>EPOCH CAPABILITIES INDEX / ECI</div>
  <div style={{...xy(74,350,860),display:'flex',flexDirection:'column',gap:14}}>{rows.slice(0,3).map((row,i)=><Reveal key={row.id} at={.12+i*.1} style={{height:173,background:i===0?C.coral:C.white,color:i===0?C.white:C.ink,border:`1px solid ${i===0?C.coral:C.line}`,display:'grid',gridTemplateColumns:'53px 55px minmax(0,1fr) 126px',gap:16,padding:'0 24px',alignItems:'center',boxSizing:'border-box'}}>
   <span style={{fontSize:43,fontFamily:mono}}>{String(row.rank).padStart(2,'0')}</span><span style={{width:55,height:55,background:C.white,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}><Logo file={row.icon} size={43}/></span><span style={{fontSize:row.name.length>18?32:42,fontWeight:750,letterSpacing:-1,whiteSpace:'nowrap'}}>{row.name}</span><div style={{borderLeft:`1px solid ${i===0?'#dfb4a6':C.line}`,paddingLeft:17}}><div style={{fontFamily:mono,fontSize:18}}>ECI</div><div style={{fontFamily:mono,fontSize:39,marginTop:5}}>{row.eci.toFixed(2)}</div></div>
  </Reveal>)}</div>
  <div style={{...xy(969,350,879),paddingLeft:28,borderLeft:`1px solid ${C.line}`,boxSizing:'border-box'}}><div style={{display:'grid',gridTemplateColumns:'50px 38px 1fr 95px',height:34,color:C.muted,fontSize:18}}><span>#</span><span/><span>模型名称</span><span style={{textAlign:'right'}}>ECI</span></div>{rows.slice(3).map((row,i)=><Reveal key={row.id} at={.25+i*.025} style={{display:'grid',gridTemplateColumns:'50px 38px 1fr 95px',alignItems:'center',height:42,borderTop:`1px solid ${C.line}`}}><span style={{fontFamily:mono,fontSize:23}}>{String(row.rank).padStart(2,'0')}</span><Logo file={row.icon} size={27}/><span style={{fontSize:domestic?25:27,fontWeight:550,whiteSpace:'nowrap'}}>{row.name}{row.id==='meta/muse-wonder-1.0'?<span style={{fontSize:17,color:C.muted}}> / 1.0</span>:null}</span><span style={{fontSize:26,fontFamily:mono,textAlign:'right'}}>{row.eci.toFixed(2)}</span></Reveal>)}</div>
  <div style={{...xy(76,924),fontSize:23,color:C.muted}}>{domestic?'按原站国内厂商筛选 · K3.1 Pro 尚无 ECI，不以 K3 分数替代。':'保留不同模型版本 · ECI 是指数，不是百分比 · 可暂停查看完整榜单。'}</div>
 </Page>;
};

const Overview:React.FC=()=> <>
 <Label>TODAY’S EDITION / 今日导读</Label><Title size={93}>今天，看这几件事。</Title>
 <div style={{...xy(76,373,1030,427),borderTop:`2px solid ${C.ink}`,paddingTop:24}}><Reveal at={.3} style={{fontFamily:mono,fontSize:27,color:C.coral}}>01 / 模型头条</Reveal><Reveal at={.5} style={{fontSize:93,fontWeight:850,lineHeight:1.16,letterSpacing:-3,marginTop:28}}>Kimi K3.1 Pro<br/><span style={{color:C.coral}}>编程与长任务</span></Reveal><div style={{display:'flex',alignItems:'center',gap:18,marginTop:32}}><Logo file="kimi.png" size={48}/><span style={{fontSize:26,color:C.muted}}>月之暗面 · 新模型发布</span></div></div>
 <div style={{...xy(1193,373,651),borderTop:`2px solid ${C.ink}`}}>{[{n:'02',name:'Harness²',desc:'Google Research · 智能体配置研究',at:1},{n:'03',name:'VoiceStudio',desc:'开源项目 · 音色设计、转写与配音',at:1.3}].map(x=><Reveal key={x.n} at={x.at} style={{padding:'27px 0 35px',borderBottom:`1px solid ${C.line}`}}><div style={{fontFamily:mono,fontSize:24,color:C.coral}}>{x.n} / 工具观察</div><div style={{fontSize:62,fontWeight:750,marginTop:14,letterSpacing:-2}}>{x.name}</div><div style={{fontSize:28,color:C.muted,marginTop:8}}>{x.desc}</div></Reveal>)}</div>
</>;
const KimiTitle:React.FC=()=> <>
 <Label>01 / MODEL RELEASE</Label><div style={{...xy(78,236),display:'flex',alignItems:'center',gap:20}}><Logo file="kimi.png" size={68}/><span style={{fontSize:30}}>Moonshot AI / 月之暗面</span></div>
 <Reveal style={{...xy(70,376,1020),fontSize:125,fontWeight:900,lineHeight:1.05,letterSpacing:-5}}>Kimi<br/>K3.1 Pro</Reveal>
 <Reveal at={.12} style={{...xy(1110,229,732,500),overflow:'hidden'}}><Img src={asset('kimi-launch.webp')} style={{width:'100%',height:'100%',objectFit:'cover'}}/><div style={{position:'absolute',bottom:16,right:18,padding:'6px 12px',background:C.white,fontSize:19,color:C.muted}}>Kimi 官方发布主视觉</div></Reveal>
 <div style={{...xy(1110,757,732),display:'flex',gap:48,borderTop:`1px solid ${C.line}`,paddingTop:14}}><Reveal at={spokenAt('kimi-title',/3万亿/)} style={{display:'flex',alignItems:'baseline',gap:15}}><span style={{fontFamily:mono,fontSize:65,color:C.coral}}>3T</span><span style={{fontSize:25}}>级参数</span></Reveal><Reveal at={spokenAt('kimi-title',/100万/)} style={{display:'flex',alignItems:'baseline',gap:15}}><span style={{fontFamily:mono,fontSize:65,color:C.coral}}>1M</span><span style={{fontSize:25}}>token</span></Reveal></div>
 <Reveal at={spokenAt('kimi-title',/编程/)} style={{...xy(78,776),fontSize:31,fontWeight:600}}>重点看编程，以及多步任务。</Reveal>
</>;
const Bar:React.FC<{name:string;value:number;delay:number;highlight?:boolean}>=({name,value,delay,highlight})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return <Reveal at={delay} style={{height:153,borderTop:`1px solid ${C.line}`,display:'grid',gridTemplateColumns:'475px 1fr 167px',gap:28,alignItems:'center'}}><div style={{fontSize:39,fontWeight:highlight?750:550,color:highlight?C.coral:C.ink}}>{name}</div><div style={{height:30,background:C.wash,position:'relative'}}><div style={{height:'100%',width:`${value}%`,background:highlight?C.coral:'#b2b1a7',transformOrigin:'left',transform:`scaleX(${interpolate(f,[(delay+.1)*fps,(delay+1.05)*fps],[0,1],clamp)})`}}/></div><div style={{fontSize:65,fontFamily:mono,textAlign:'right',color:highlight?C.coral:C.ink}}>{value.toFixed(1)}<span style={{fontSize:29}}>%</span></div></Reveal>;};
const KimiBench:React.FC=()=> <>
 <Label>01 / CODING · 发布方公布的比较</Label><Title size={86}>终端任务评测</Title>
 <div style={{...xy(77,334),fontSize:29,color:C.muted}}>Terminal-Bench 4.0 · 各项以发布方注明的评测条件为准</div>
 <div style={xy(78,411,1760)}><Bar name="Kimi K3.1 Pro" value={65.7} delay={.3} highlight/><Bar name="GPT-6 Astra" value={58.2} delay={.5}/><Bar name="Claude Opus 5.5" value={66.4} delay={.7}/></div>
 <div style={{...xy(580,826,1050),display:'flex',justifyContent:'space-between',fontFamily:mono,fontSize:19,color:C.muted}}><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>
</>;
const KimiCreative:React.FC=()=> <>
 <Label>01 / CREATIVE WORK · 官方案例</Label><Title size={85}>代码，也进入游戏与三维。</Title>
 <div style={{...xy(77,357,1767),display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>{[{img:'kimi-godot.webp',name:'Godot 游戏作品',note:'官方案例截图，不是本栏目实测',delay:.15},{img:'kimi-3d.webp',name:'3D Make 制作入口',note:'官方界面图，可在线预览与编辑',delay:.3}].map(x=><Reveal key={x.img} at={x.delay}><div style={{width:867,height:430,overflow:'hidden',border:`1px solid ${C.line}`}}><Img src={asset(x.img)} style={{width:'100%',height:'100%',objectFit:'contain',background:C.white}}/></div><div style={{fontSize:32,fontWeight:700,marginTop:15}}>{x.name}<span style={{fontSize:20,fontWeight:450,color:C.muted,marginLeft:22}}>{x.note}</span></div></Reveal>)}</div>
</>;
const KimiAccess:React.FC=()=> <>
 <Label>01 / AVAILABILITY</Label><Title size={91}>现在能用，权重还要等。</Title>
 <div style={{...xy(77,382,1767),display:'grid',gridTemplateColumns:'1fr 1fr',gap:70}}><Reveal at={cueAt('kimi-access',1)} style={{borderTop:`2px solid ${C.ink}`,paddingTop:28}}><div style={{fontFamily:mono,fontSize:26,color:C.muted}}>NOW / 已上线</div><div style={{fontSize:84,fontWeight:800,marginTop:35}}>在线体验与接入</div><div style={{fontSize:36,color:C.muted,marginTop:35,lineHeight:1.8}}>Kimi.com<br/>Kimi Code<br/>Kimi API</div></Reveal><Reveal at={cueAt('kimi-access',2)} style={{borderTop:`2px solid ${C.coral}`,paddingTop:28}}><div style={{fontFamily:mono,fontSize:26,color:C.coral}}>BY NOV 04 / 官方计划</div><div style={{fontFamily:mono,fontSize:145,color:C.coral,letterSpacing:-7,marginTop:7}}>11/04<span style={{fontSize:39,letterSpacing:0,marginLeft:18}}>前</span></div><div style={{fontSize:42,fontWeight:700,marginTop:15}}>开放完整模型权重</div><div style={{fontSize:29,color:C.muted,marginTop:23}}>下载与许可，以实际开放版本为准。</div></Reveal></div>
</>;
const HarnessDiagram:React.FC=()=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();const s=f/fps;const phases=[{n:'01',title:'提出修改',desc:'提示词 / 工具配置',at:spokenAt('harness',/调整这些配置/)},{n:'02',title:'同任务试跑',desc:'比较执行结果',at:spokenAt('harness',/比较不同方案/)},{n:'03',title:'组合修改',desc:'保留有效的部分',at:spokenAt('harness',/有效的修改/)}];
 return <><Label>02 / RECENT TOOLS · GOOGLE RESEARCH 仓库</Label><Title size={87}>Harness²：改进工作方法。</Title><div style={{...xy(78,346),fontSize:32,color:C.muted}}>模型权重保持不变，调整围绕模型的执行系统。</div><div style={{...xy(78,464,1762),display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:50}}>{phases.map((x,i)=><Reveal key={x.n} at={.4+i*.15} style={{position:'relative',borderTop:`2px solid ${s>=x.at?C.coral:C.line}`,paddingTop:29}}><div style={{fontFamily:mono,fontSize:108,color:C.coral}}>{x.n}</div><div style={{fontSize:56,fontWeight:750,marginTop:17}}>{x.title}</div><div style={{fontSize:30,color:C.muted,marginTop:20}}>{x.desc}</div>{i<2?<span style={{position:'absolute',right:-35,top:113,fontSize:43,color:C.coral}}>→</span>:null}</Reveal>)}</div></>;
};
const HarnessUse:React.FC=()=> <>
 <Label>02 / WHAT CHANGES</Label><Title size={89}>把执行流程，也拿来比较。</Title>
 <Reveal at={.12} style={{...xy(77,372,1767,428),background:C.white,border:`1px solid ${C.line}`,padding:'25px 14px',boxSizing:'border-box'}}><Img src={asset('harness-pipeline.png')} style={{width:'100%',height:'100%',objectFit:'contain'}}/></Reveal>
 <div style={{...xy(78,822,1764),display:'flex',justifyContent:'space-between',fontSize:25,color:C.muted}}><span>官方结构图：任务内试跑比较，跨任务保留经验</span><span>模型权重保持不变 · 非本栏目实测</span></div>
</>;
const Voice:React.FC=()=> <>
 <Label>03 / OPEN-SOURCE PICK · 工具选读</Label><Title size={91}>VoiceStudio</Title><div style={{...xy(1698,175)}}><Logo file="voicestudio.png" size={113}/></div>
 <div style={{...xy(78,342),fontSize:37,color:C.muted}}>把声音制作，放进一个本地工作台。</div>
 <div style={{...xy(78,438,655)}}>{[{name:'音色设计',at:spokenAt('voice',/音色设计/)},{name:'录音转文字',at:spokenAt('voice',/录音转成文字/)},{name:'视频配音',at:spokenAt('voice',/为视频配音/)}].map((x,i)=><Reveal at={x.at} key={x.name} style={{height:122,borderTop:`1px solid ${C.line}`,display:'flex',alignItems:'center',gap:30}}><span style={{fontFamily:mono,fontSize:26,color:C.coral}}>0{i+1}</span><span style={{fontSize:50,fontWeight:700}}>{x.name}</span></Reveal>)}</div>
 <Reveal at={.15} style={{...xy(799,358,1045,486),overflow:'hidden',border:`1px solid ${C.line}`}}><Img src={asset('voice-workspace.png')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/><div style={{position:'absolute',right:12,bottom:12,background:C.white,padding:'6px 12px',fontSize:18}}>官方配音工作区截图 · 未安装实测</div></Reveal>
 <Reveal at={.4} style={{...xy(78,829),fontSize:26,color:C.muted}}>debpalash / VoiceStudio · 开源项目选读</Reveal>
</>;
const VoiceConnect:React.FC=()=> <>
 <Label>03 / LOCAL API · 使用条件</Label><Title size={88}>把声音接进制作流程</Title>
 <div style={{...xy(78,352),fontSize:32,color:C.muted}}>VoiceStudio · 本地 API / MCP · 示意，非实际运行演示</div>
 <div style={{...xy(78,458,1764),display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:54}}>{[
  {title:'输入素材',detail:'录音 / 文本',number:'01'},
  {title:'VoiceStudio',detail:'调用所选语音引擎',number:'02'},
  {title:'制作输出',detail:'配音 / 转写',number:'03'},
 ].map((x,i)=><Reveal key={x.number} at={.2+i*.15} style={{position:'relative',background:C.white,borderTop:`2px solid ${C.coral}`,padding:'24px 28px 38px',boxSizing:'border-box'}}><div style={{fontFamily:mono,fontSize:25,color:C.coral}}>{x.number}</div><div style={{fontSize:47,fontWeight:750,marginTop:27}}>{x.title}</div><div style={{fontSize:29,color:C.muted,marginTop:24}}>{x.detail}</div>{i<2?<span style={{position:'absolute',right:-40,top:110,fontSize:40,color:C.coral}}>→</span>:null}</Reveal>)}</div>
 <Reveal at={spokenAt('voice-api',/电脑配置/)} style={{...xy(78,765,1764),borderTop:`1px solid ${C.line}`,paddingTop:25,fontSize:33}}>安装前先确认：电脑配置，以及所选语音引擎的要求。</Reveal>
</>;
const Close:React.FC=()=> <>
 <Label>THE TAKEAWAY / 本期回顾</Label><Title size={93}>今天，值得记住。</Title>
 <div style={{...xy(78,385,1765)}}>{[['Kimi K3.1 Pro','在线已可用，权重关注 11/04 前。'],['Harness²','尝试改进 Agent 的执行流程。'],['VoiceStudio','本地语音制作，可接自动化流程。']].map((x,i)=><Reveal key={x[0]} at={.2+i*.3} style={{height:139,display:'grid',gridTemplateColumns:'90px 580px 1fr',alignItems:'center',borderTop:`1px solid ${C.line}`}}><span style={{fontFamily:mono,fontSize:29,color:C.coral}}>0{i+1}</span><span style={{fontSize:48,fontWeight:750}}>{x[0]}</span><span style={{fontSize:35}}>{x[1]}</span></Reveal>)}</div>
 <div style={{...xy(78,847),fontSize:22,color:C.muted}}>BGM: Carefree · Kevin MacLeod / incompetech.com · CC BY 4.0</div>
</>;

const SOURCES:Record<string,string>={overview:'本期选读：Kimi 官方技术博客 · google-research/harness2 · debpalash/VoiceStudio','kimi-title':'来源：Kimi K3.1 Pro 官方技术博客 · 2026.10.24','kimi-bench':'来源：Kimi 技术博客 / Terminal-Bench 4.0 · 发布方比较，非本栏目独立实测','kimi-creative':'图源：Kimi 官方技术博客 / Godot 案例与 3D Make · 仅作新闻介绍','kimi-access':'来源：Kimi 官方 Availability · 完整权重为计划开放，非当前可下载声明',harness:'来源：google-research/harness2 README · 近期工具观察，不标为今日新发布','harness-use':'来源：Harness² / Harness components · 本片为原理示意，未安装运行',voice:'来源：debpalash/VoiceStudio README · 工具选读，未安装实测','voice-api':'来源：debpalash/VoiceStudio README · 本地接口与引擎说明，未安装实测',close:'完整新闻来源、模型榜单、素材与 BGM 署名随本期工程保留'};
const SceneContent:React.FC<{id:string}>=({id})=>{switch(id){case'overview':return <Overview/>;case'kimi-title':return <KimiTitle/>;case'kimi-bench':return <KimiBench/>;case'kimi-creative':return <KimiCreative/>;case'kimi-access':return <KimiAccess/>;case'harness':return <HarnessDiagram/>;case'harness-use':return <HarnessUse/>;case'voice':return <Voice/>;case'voice-api':return <VoiceConnect/>;case'close':return <Close/>;default:throw Error(`Unknown scene ${id}`);}};
const Subtitles:React.FC=()=>{const f=useCurrentFrame();const c=timeline.cues.find(x=>f>=x.from&&f<x.to);if(!c)return null;return <div style={{...xy(192,903,1536,61),display:'flex',justifyContent:'center',alignItems:'center',fontFamily:sans,fontSize:36,fontWeight:600,color:C.ink,background:C.white,borderLeft:`4px solid ${C.coral}`,boxSizing:'border-box'}}>{c.text}</div>;};
const Music:React.FC=()=> <Audio src={staticFile('edition/mix.wav')}/>;
export const EditionVideo:React.FC=()=>{const {fps}=useVideoConfig();return <FontGate><AbsoluteFill style={{background:C.paper}}>{timeline.scenes.map((s:Scene)=><Sequence name={s.title} key={s.id} from={Math.round(s.start*fps)} durationInFrames={Math.round((s.end-s.start)*fps)}>{s.id==='global'?<Ranking/>:s.id==='domestic'?<Ranking domestic/>:<Page section={`${s.id.startsWith('kimi')?'01 / 模型头条':s.id.startsWith('harness')?'02 / 工具观察':s.id.startsWith('voice')?'03 / 工具选读':s.id==='close'?'END / 本期回顾':'今日资讯总览'}`} seconds={s.end-s.start} source={SOURCES[s.id]}><SceneContent id={s.id}/></Page>}</Sequence>)}<Subtitles/><Music/></AbsoluteFill></FontGate>;};
export const EditionCover:React.FC=()=> <FontGate><Page section="模型头条 / 2026.10.24" seconds={1} source="Kimi K3.1 Pro 官方技术博客 · 在线已可用，完整权重计划 11/04 前开放">
 <Label>NEW MODEL / 新模型发布</Label><div style={{...xy(77,254),display:'flex',alignItems:'center',gap:25}}><Logo file="kimi.png" size={100}/><span style={{fontSize:42,fontWeight:650}}>月之暗面 / Kimi</span></div>
 <div style={{...xy(68,415),fontSize:123,fontWeight:900,lineHeight:1.12,letterSpacing:-5}}>K3.1 Pro<br/><span style={{color:C.coral}}>编程与 3D<br/>再进一版。</span></div>
 <div style={{...xy(1190,230,652,636),overflow:'hidden'}}><Img src={asset('kimi-launch.webp')} style={{width:'100%',height:'100%',objectFit:'cover'}}/><div style={{position:'absolute',left:25,bottom:24,background:C.white,padding:'11px 18px',fontSize:22}}>Kimi 官方发布主视觉</div></div>
 <div style={{...xy(80,877),fontSize:30}}>3T 级参数 · 百万上下文 · 完整权重 11/04 前</div>
</Page></FontGate>;
export const EditionRoot:React.FC=()=> <><Composition id="DailyAI20261024" component={EditionVideo} durationInFrames={timeline.durationInFrames} fps={60} width={1920} height={1080}/><Still id="DailyAI20261024Cover" component={EditionCover} width={1920} height={1080}/></>;
