import React from 'react';
import {Img,OffthreadVideo,Sequence,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,Frame,Reveal,asset,mono,xy} from './Design';
import {NewsScene,content,timeline} from './data';

// Relative frames come from this recording's actual cue windows, never word-count estimates.
const point=(id:string,text:string,fallback=0)=>{
 if(content.motion?.[`${id}:${text}`]!==undefined)return content.motion[`${id}:${text}`];
 const s=timeline.scenes.find(s=>s.id===id)!;
 const c=timeline.cues.find(c=>c.from>=Math.round(s.start*60)-1&&c.from<Math.round(s.end*60)&&c.text.includes(text));
 return c?Math.max(0,c.from-Math.round(s.start*60)):fallback;
};
const In:React.FC<React.PropsWithChildren<{id:string;word:string;fallback?:number;style?:React.CSSProperties}>>=({id,word,fallback=0,style,children})=><Reveal at={point(id,word,fallback)/60} style={style}>{children}</Reveal>;
const Rule:React.FC<React.PropsWithChildren<{label:string}>>=({label,children})=><div style={{borderTop:`1px solid ${C.line}`,paddingTop:18}}><div style={{fontSize:23,color:C.coral,marginBottom:16}}>{label}</div><div style={{fontSize:39,fontWeight:750,lineHeight:1.4}}>{children}</div></div>;
const Badge:React.FC<React.PropsWithChildren>=({children})=><span style={{display:'inline-block',padding:'9px 17px',border:`1px solid ${C.line}`,fontSize:24,color:C.muted,marginRight:12,background:C.white}}>{children}</span>;
const Title:React.FC<React.PropsWithChildren>=({children})=><Reveal style={{...xy(76,164,1768),fontSize:65,lineHeight:1.2,fontWeight:850,letterSpacing:-1.5}}>{children}</Reveal>;

const Film:React.FC<{scene:NewsScene;duration:number;left?:number;width?:number;height?:number}>=({scene,duration,left=626,width=1218,height=574})=>{
 const {fps}=useVideoConfig();const m=scene.media!;
 const frames=Math.min(duration,Math.round(((m.sourceOut??0)-(m.sourceIn??0))*fps));
 return <><div style={{...xy(left,314,width,height),background:C.white,border:`1px solid ${C.line}`,overflow:'hidden'}}>
  {m.poster?<Img src={asset(m.poster)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:null}
  <Sequence durationInFrames={frames} layout="none"><OffthreadVideo src={asset(m.file)} trimBefore={Math.round((m.sourceIn??0)*fps)} trimAfter={Math.round((m.sourceOut??0)*fps)} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}}/></Sequence>
 </div><div style={{...xy(left,902,width),fontSize:20,color:C.muted}}>{m.label} · 原速 / 原片静音</div></>;
};

const Longcat:React.FC<{scene:NewsScene}>=({scene})=><>
 <Title>美团 LongCat-2.5 正式版开放接口</Title>
 <div style={{...xy(78,326,440),borderTop:`3px solid ${C.coral}`,paddingTop:32}}><div style={{fontSize:27,color:C.coral}}>11月2日 · 正式版</div><div style={{fontSize:99,fontWeight:850,marginTop:26,letterSpacing:-5}}>LongCat</div><div style={{fontSize:156,fontFamily:mono,color:C.coral,lineHeight:1.15}}>2.5</div></div>
 <div style={{...xy(620,330,1224),display:'grid',gridTemplateColumns:'1fr 1fr',gap:46}}>
 <In id={scene.id} word="视觉理解"><Rule label="视觉能力">理解图像<br/>结合编程任务</Rule></In>
 <In id={scene.id} word="持续执行" fallback={360}><Rule label="持续执行">复杂代码库<br/>完整项目构建</Rule></In>
 </div>
 <In id={scene.id} word="持续执行" fallback={480} style={{...xy(620,718,1224),borderTop:`1px solid ${C.line}`,paddingTop:28,fontSize:32,color:C.muted}}>从一次回答，走向需要持续推进的开发任务。</In>
 </>;
const LongcatDemo:React.FC<{scene:NewsScene;duration:number}>=({scene,duration})=><>
 <Title>{scene.title}</Title>
 <div style={xy(78,321,482)}><Rule label="官方生成案例">{scene.id==='longcat-office'?<>商业分析<br/>生成案例</>:<>交互式<br/>三维文物展览</>}</Rule>
 <In id={scene.id} word="目前" fallback={300} style={{marginTop:40}}><Rule label="体验入口">官方网页与接口</Rule></In>
 <In id={scene.id} word="不过" fallback={620} style={{marginTop:34,fontSize:30,color:C.coral,lineHeight:1.5}}>代码与模型下载<br/>仍标「敬请期待」</In></div>
 <Film scene={scene} duration={duration}/>
 </>;
const Carbon:React.FC<{scene:NewsScene}>=({scene})=><>
 <Title>Gemini 4 Carbon：长任务与网络安全</Title>
 <div style={{...xy(78,312,860),fontSize:25,color:C.coral}}>近期进展 · 10月28日发布</div>
 <div style={xy(78,392,850)}><In id={scene.id} word="复杂工程" fallback={360}><Rule label="01 / 长程工程">持续完成复杂工程任务</Rule></In>
 <In id={scene.id} word="软件漏洞" fallback={510} style={{marginTop:66}}><Rule label="02 / 网络安全">发现、验证和修复漏洞</Rule></In></div>
 <div style={{...xy(1010,314,834,524),background:C.white,overflow:'hidden'}}><Img src={asset(scene.media!.file)} style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>
 <div style={{...xy(1010,861,834),fontSize:24,color:C.muted}}>Google 官方发布图 · 非本栏目实测</div>
 </>;
const CarbonLimits:React.FC<{scene:NewsScene}>=({scene})=><>
 <Title>Carbon：评测有条件，开放也有范围</Title>
 <div style={{...xy(78,318,1050,590),border:`1px solid ${C.line}`,background:C.white,display:'flex',alignItems:'center'}}><Img src={asset(scene.media!.file)} style={{width:'100%',objectFit:'contain'}}/></div>
 <div style={xy(1190,326,650)}><Rule label="官方评测">成绩有各自的测试条件</Rule>
 <In id={scene.id} word="日常使用" fallback={240} style={{fontSize:30,color:C.muted,lineHeight:1.5,marginTop:27}}>评测结果不能直接等同于<br/>日常使用效果</In>
 <In id={scene.id} word="开放方面" fallback={680} style={{marginTop:52}}><Rule label="初期开放">部分安全防御人员<br/>与可信合作伙伴</Rule></In>
 <In id={scene.id} word="所有用户" fallback={1050} style={{marginTop:24,fontSize:27,color:C.coral}}>并非所有用户立即可用</In></div>
 </>;
const Genie:React.FC<{scene:NewsScene;duration:number;limits?:boolean}>=({scene,duration,limits=false})=><>
 <Title>{limits?'Genie 4 仍是研究预览，能力存在限制':'Genie 4：用文字修改可交互世界'}</Title>
 <div style={xy(78,324,482)}><div style={{fontSize:24,color:C.coral,marginBottom:30}}>10月27日 · 研究预览</div>
 {limits?<><Rule label="连续交互">几分钟级别</Rule><In id={scene.id} word="一致性" fallback={440} style={{marginTop:37}}><Rule label="仍有限制">画面一致性<br/>声音准确性</Rule></In><In id={scene.id} word="成熟" fallback={780} style={{fontSize:28,color:C.coral,marginTop:36}}>还不能当作成熟游戏引擎</In></>:<><Rule label="交互方式">键盘移动视角</Rule><In id={scene.id} word="改变天气" fallback={600} style={{marginTop:36}}><Rule label="实时文字修改">改变天气、添加角色</Rule></In><In id={scene.id} word="声音" fallback={1000} style={{fontSize:29,color:C.coral,marginTop:36}}>同时生成环境声音与对话</In></>}
 </div><Film scene={scene} duration={duration}/>
 </>;
const NumberReveal:React.FC<{id:string;word:string;value:string;label:string;width:number;left:number}>=({id,word,value,label,width,left})=>{
 const frame=useCurrentFrame();const start=point(id,word,120);const progress=interpolate(frame,[start,start+42],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <div style={{...xy(left,333,width,410),borderTop:`2px solid ${C.line}`,paddingTop:22}}><div style={{fontSize:26,color:C.muted}}>{label}</div><div style={{fontFamily:mono,fontSize:170,fontWeight:800,color:C.coral,lineHeight:1.6,opacity:progress,transform:`translateY(${(1-progress)*24}px)`,clipPath:`inset(${(1-progress)*100}% 0 0 0)`}}>{value}</div></div>;
};
const Tasks:React.FC<{scene:NewsScene}>=({scene})=><>
 <Title>GDPx：把复杂专业工作交给智能体</Title>
 <NumberReveal id={scene.id} word="11个领域" value="11" label="专业领域" left={78} width={480}/>
 <NumberReveal id={scene.id} word="206个任务" value="206" label="实际任务" left={640} width={580}/>
 <div style={{...xy(1350,355,490),fontSize:32,lineHeight:1.8,borderLeft:`1px solid ${C.line}`,paddingLeft:36}}>芯片设计<br/>软件工程<br/>法律等</div>
 <In id={scene.id} word="文件和工具" fallback={480} style={{...xy(78,770,1764),fontSize:36,borderTop:`1px solid ${C.line}`,paddingTop:28}}>在复杂文件与工具环境里完成工作，而不只是回答一道题。</In>
 </>;
const Score:React.FC<{scene:NewsScene}>=({scene})=><>
 <Title>GDPx 综合得分，不等于现实成功率</Title>
 <NumberReveal id={scene.id} word="12%" value="12%" label="本次默认榜单最高综合分" left={78} width={750}/>
 <div style={xy(978,330,866)}><In id={scene.id} word="评分方式" fallback={300}><Rule label="这项分数是什么">混合不同任务评分方式<br/>形成的综合成绩</Rule></In>
 <In id={scene.id} word="不代表" fallback={580} style={{marginTop:52}}><Rule label="解读边界">不代表现实工作中<br/>只有 12% 的成功率</Rule></In></div>
 <In id={scene.id} word="可靠" fallback={950} style={{...xy(78,805,1766),fontSize:33,color:C.muted,borderTop:`1px solid ${C.line}`,paddingTop:25}}>能回答问题，与能可靠地完成复杂工作，仍有差距。</In>
 </>;
const Closing:React.FC=()=> <><div style={{...xy(78,250,1764),fontSize:110,fontWeight:850}}>今天的精选资讯</div><div style={{...xy(82,445,1764),fontSize:46,color:C.coral}}>LongCat · Gemini Carbon · Genie 4 · GDPx</div><div style={{...xy(78,659,1764),fontSize:81,fontWeight:750}}>我们下期再见。</div></>;
export const News:React.FC<{scene:NewsScene;duration:number}>=({scene,duration})=><Frame section={scene.section} source={scene.source}>
 {scene.id==='longcat-release'?<Longcat scene={scene}/>:scene.id==='longcat-demos'||scene.id==='longcat-office'?<LongcatDemo scene={scene} duration={duration}/>:scene.id==='carbon-release'?<Carbon scene={scene}/>:scene.id==='carbon-limits'?<CarbonLimits scene={scene}/>:scene.id==='genie-world'?<Genie scene={scene} duration={duration}/>:scene.id==='genie-limits'?<Genie scene={scene} duration={duration} limits/>:scene.id==='gdpx-tasks'?<Tasks scene={scene}/>:scene.id==='gdpx-scores'?<Score scene={scene}/>:<Closing/>}
 </Frame>;
