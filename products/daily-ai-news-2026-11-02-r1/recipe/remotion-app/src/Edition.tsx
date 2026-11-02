import React from 'react';
import {AbsoluteFill,Audio,Composition,Img,OffthreadVideo,Sequence,Still,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {C,FontGate,Frame,Logo,Ranking,Reveal,asset,sans,xy} from './Design';
import {content,edition,timeline,NewsScene} from './data';
import {News} from './News';
const Overview:React.FC=()=> <Frame section="今日 AI 资讯" source={content.headline.source}>
 <Reveal style={{...xy(78,162,1764),fontSize:88,fontWeight:850}}>今日 AI 资讯</Reveal>
 <div style={{...xy(78,320,1764),display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:68}}>{content.stories.map((s,i)=><Reveal key={i} at={i*.08} style={{borderTop:`${i===0?3:1}px solid ${i===0?C.coral:C.line}`,paddingTop:24,gridRow:i===0?`span ${Math.max(1,content.stories.length-1)}`:undefined}}><div style={{fontSize:i===0?62:36,fontWeight:800,lineHeight:1.25,color:i===0?C.coral:C.ink}}>{i===0?<>美团 LongCat-2.5<br/>正式版开放接口</>:s.title}</div><div style={{fontSize:29,color:C.muted,marginTop:22,lineHeight:1.5}}>{s.detail}</div></Reveal>)}</div>
 </Frame>;
const Body:React.FC<{scene:NewsScene;duration:number}>=({scene,duration})=>{const {fps}=useVideoConfig(),m=scene.media,hasMedia=!!m;const clipFrames=m?.kind==='video'?Math.min(duration,Math.round(((m.sourceOut??0)-(m.sourceIn??0))*fps)):0;return <Frame section={scene.section} source={scene.source}>
 <Reveal style={{...xy(78,161,1764),fontSize:scene.title.length>25?65:82,fontWeight:850,lineHeight:1.15,letterSpacing:-2}}>{scene.title}</Reveal>
 <div style={{...xy(78,318,hasMedia?636:1695),fontSize:36,lineHeight:1.5,color:C.muted}}>{scene.lead}</div>
 <div style={{...xy(78,hasMedia?492:465,hasMedia?620:1680),display:'grid',gridTemplateColumns:hasMedia?'1fr':`repeat(${Math.min(3,Math.max(1,scene.bullets?.length??1))},1fr)`,gap:26}}>{scene.bullets?.map((b,i)=><Reveal at={.12+i*.09} key={i} style={{borderTop:`1px solid ${C.line}`,paddingTop:19,fontSize:35,fontWeight:650,lineHeight:1.4}}><span style={{color:C.coral,fontSize:24,marginRight:16}}>{String(i+1).padStart(2,'0')}</span>{b}</Reveal>)}</div>
 {m?<div style={{...xy(790,318,1054,574),background:C.white,border:`1px solid ${C.line}`,boxSizing:'border-box',padding:12,overflow:'hidden'}}>
  {m.kind==='image'?<Img src={asset(m.file)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<>
   {m.poster?<Img src={asset(m.poster)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:null}
   <Sequence durationInFrames={clipFrames} layout="none"><OffthreadVideo src={asset(m.file)} trimBefore={Math.round((m.sourceIn??0)*fps)} trimAfter={Math.round((m.sourceOut??0)*fps)} muted style={{position:'absolute',inset:12,width:1028,height:548,objectFit:'contain'}}/></Sequence>
  </>}
  </div>:null}
 {m?.label?<div style={{...xy(790,905,1054),fontSize:20,color:C.muted}}>{m.label}</div>:null}
 </Frame>;};
const Subtitles:React.FC=()=>{const f=useCurrentFrame(),c=timeline.cues.find(v=>f>=v.from&&f<v.to);return c?<div style={{...xy(109,937,1702,59),display:'flex',alignItems:'center',justifyContent:'center',padding:'0 22px',boxSizing:'border-box',background:C.white,borderLeft:`4px solid ${C.coral}`,fontFamily:sans,fontWeight:600,fontSize:37,color:C.ink,whiteSpace:'nowrap'}}>{c.text}</div>:null;};
export const EditionVideo:React.FC=()=> <FontGate><AbsoluteFill style={{background:C.paper}}>{timeline.scenes.map(s=>{const from=Math.round(s.start*60),duration=Math.round(s.end*60)-from;const scene=content.scenes.find(c=>c.id===s.id);return <Sequence key={s.id} name={s.title} from={from} durationInFrames={duration}>{s.id==='global'?<Ranking/>:s.id==='domestic'?<Ranking domestic/>:s.id==='overview'?<Overview/>:scene?<News scene={scene} duration={duration}/>:null}</Sequence>;})}<Subtitles/><Audio src={staticFile('edition/mix.wav')}/></AbsoluteFill></FontGate>;
export const Cover:React.FC=()=> <FontGate><Frame section="今日 AI 资讯 / 模型头条" source={content.headline.source}>
 <div style={{...xy(270,244),display:'flex',alignItems:'center',gap:26}}><Logo file={content.headline.logo} size={100}/><span style={{fontSize:39,color:C.coral}}>今日 AI 资讯</span></div>
 <div style={{...xy(270,435,1380),fontSize:content.headline.title.length>22?98:126,fontWeight:900,lineHeight:1.16,letterSpacing:-4}}>{content.headline.title}</div>
 <div style={{...xy(270,805,1380),fontSize:37,color:C.muted,lineHeight:1.4}}>{content.headline.subtitle}</div>
 </Frame></FontGate>;
export const EditionRoot:React.FC=()=> <><Composition id={edition.compositionId} component={EditionVideo} width={1920} height={1080} fps={60} durationInFrames={timeline.durationInFrames}/><Still id={edition.coverCompositionId} component={Cover} width={1920} height={1080}/></>;
