import React from 'react';
import {AbsoluteFill,Audio,Composition,Sequence,Still,staticFile,useCurrentFrame} from 'remotion';
import {C,FontGate,Frame,Logo,Ranking,mono,sans,xy} from './Design';
import {content,edition,timeline} from './data';
import {Body,Overview} from './Scenes';

const Subtitles:React.FC=()=>{
 const frame=useCurrentFrame();
 const cue=timeline.cues.find(c=>frame>=c.from&&frame<c.to);
 return cue?<div style={{...xy(109,935,1702,64),display:'flex',alignItems:'center',justifyContent:'center',padding:'0 22px',boxSizing:'border-box',background:C.white,borderLeft:`4px solid ${C.coral}`,fontFamily:sans,fontWeight:650,fontSize:42,color:C.ink,whiteSpace:'nowrap'}}>{cue.text}</div>:null;
};
export const EditionVideo:React.FC=()=> <FontGate><AbsoluteFill style={{background:C.paper}}>
 {timeline.scenes.map(s=>{
  const from=Math.round(s.start*60),duration=Math.round(s.end*60)-from;
  const scene=content.scenes.find(c=>c.id===s.id);
  return <Sequence key={s.id} name={s.title} from={from} durationInFrames={duration}>{s.id==='global'?<Ranking/>:s.id==='domestic'?<Ranking domestic/>:s.id==='overview'?<Overview/>:scene?<Body scene={scene} duration={duration}/>:null}</Sequence>;
 })}
 <Subtitles/><Audio src={staticFile('edition/mix.wav')}/>
 </AbsoluteFill></FontGate>;
export const Cover:React.FC=()=> <FontGate><Frame section="今日 AI 资讯 / 模型头条" source="Liquid AI 10/27 官方发布；1 GB 指 1.7B 文本模型的 4 位模型本体">
 <div style={{...xy(100,177),display:'flex',alignItems:'center',gap:25}}><Logo file={content.headline.logo} size={80}/><span style={{fontSize:39,color:C.coral}}>LIQUID AI / LFM3</span></div>
 <div style={{...xy(95,352,1180),fontSize:178,fontWeight:900,lineHeight:1.1,letterSpacing:-5}}>LFM3 发布</div>
 <div style={{...xy(102,615,1170),fontSize:76,fontWeight:800,lineHeight:1.3,color:C.coral}}>小模型，面向本地应用</div>
 <div style={{...xy(108,811,1170),fontSize:36,color:C.muted}}>文字、视觉与语音分工 · 权重可下载</div>
 <div style={{...xy(1355,372,480,400),borderTop:`3px solid ${C.coral}`,paddingTop:38}}><div style={{fontFamily:mono,fontSize:138,fontWeight:850,color:C.coral,letterSpacing:-7}}>1 GB</div><div style={{fontSize:32,color:C.muted,lineHeight:1.7,marginTop:35}}>1.7B 文本模型<br/>4 位模型本体约占</div></div>
 </Frame></FontGate>;
export const EditionRoot:React.FC=()=> <><Composition id={edition.compositionId} component={EditionVideo} width={1920} height={1080} fps={60} durationInFrames={timeline.durationInFrames}/><Still id={edition.coverCompositionId} component={Cover} width={1920} height={1080}/></>;
