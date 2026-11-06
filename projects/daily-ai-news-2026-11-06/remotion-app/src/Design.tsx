import React,{useEffect,useState} from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill,Easing,Img,cancelRender,continueRender,delayRender,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {edition,ranking} from './data';
export const C={paper:'#f7f5ef',white:'#fdfcf8',ink:'#191a17',coral:'#a8513c',muted:'#74766a',line:'#cfcec3'};
export const sans="'DailySC',sans-serif",mono="'DailyMono',monospace";
export const xy=(left:number,top:number,width?:number,height?:number):React.CSSProperties=>({position:'absolute',left,top,width,height});
export const asset=(file:string)=>staticFile(`edition/${file.startsWith('assets/')?file:`assets/${file}`}`);
let fonts:Promise<unknown>|undefined;
export const FontGate:React.FC<React.PropsWithChildren>=({children})=>{
 const [handle]=useState(()=>delayRender('Local daily-news fonts'));
 useEffect(()=>{fonts??=Promise.all([loadFont({family:'DailySC',url:staticFile('edition/fonts/sans.ttf')}),loadFont({family:'DailyMono',url:staticFile('edition/fonts/mono.ttf')})]);fonts.then(()=>continueRender(handle)).catch(cancelRender);},[handle]);return <>{children}</>;
};
export const Reveal:React.FC<React.PropsWithChildren<{at?:number;style?:React.CSSProperties}>>=({children,at=0,style})=>{const f=useCurrentFrame(),{fps}=useVideoConfig();return <div style={{...style,opacity:interpolate(f,[at*fps,(at+.25)*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)}),transform:`translateY(${interpolate(f,[at*fps,(at+.35)*fps],[12,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}px)`}}>{children}</div>;};
export const Logo:React.FC<{file:string;size?:number}>=({file,size=50})=><Img src={asset(file)} style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>;
export const Frame:React.FC<React.PropsWithChildren<{section:string;source?:string;rankingPage?:boolean}>>=({children,section,source,rankingPage})=><AbsoluteFill style={{background:C.paper,color:C.ink,fontFamily:sans,overflow:'hidden'}}>
 <div style={{position:'absolute',inset:28,border:`1px solid ${C.line}`}}/>
 <div style={{...xy(76,51,1768,61),display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.line}`,paddingBottom:17}}><div style={{display:'flex',alignItems:'center',gap:16}}><span style={{width:16,height:16,background:C.coral}}/><span style={{fontSize:35,fontWeight:850}}>每日 AI</span><span style={{fontSize:20,fontFamily:mono,color:C.muted,marginLeft:16}}>{edition.date.replaceAll('-','.')}</span></div><span style={{fontSize:22,color:C.muted}}>{section}</span></div>
 {children}
 <div style={{...xy(76,1008,1768,37),borderTop:`1px solid ${C.line}`,paddingTop:11,fontSize:18,color:C.muted,display:'flex',justifyContent:'space-between'}}><span>{rankingPage?`数据查询：${new Date(ranking.queriedAt).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'})}（北京时间）`:source}</span><span style={{fontFamily:mono}}>DAILY AI / {edition.date.slice(-2)}</span></div>
</AbsoluteFill>;
export const Ranking:React.FC<{domestic?:boolean}>=({domestic=false})=>{const rows=domestic?ranking.domestic:ranking.global;return <Frame section={domestic?'开场榜单 / 国产':'开场榜单 / 全球'} rankingPage>
 <div style={{...xy(77,158),fontSize:23,fontFamily:mono,color:C.coral,letterSpacing:1}}>MODEL CAPABILITIES / ECI</div>
 <Reveal style={{...xy(73,214,1775),fontSize:96,fontWeight:850,lineHeight:1.15,letterSpacing:-2.3}}>{domestic?'国产':'全球'} AI 模型综合能力 TOP15</Reveal>
 <div style={{...xy(78,331),fontSize:27,color:C.muted}}>综合能力评分（ECI），分数越高，模型综合表现越好。</div>
 <div style={xy(77,395,947)}>{rows.slice(0,3).map((r,i)=><Reveal key={r.id} at={i*.12} style={{height:148,marginBottom:19,border:`1px solid ${i===0?C.coral:C.line}`,background:i===0?C.coral:C.white,color:i===0?'white':C.ink,display:'grid',gridTemplateColumns:'65px 66px 1fr 202px',alignItems:'center',gap:14,padding:'0 21px',boxSizing:'border-box'}}><span style={{fontFamily:mono,fontSize:42,fontWeight:700}}>{String(i+1).padStart(2,'0')}</span><div style={{width:59,height:59,borderRadius:'50%',background:C.white,display:'grid',placeItems:'center'}}><Logo file={r.icon} size={48}/></div><div style={{fontSize:Math.max(29,43-Math.max(0,r.name.length-16)),fontWeight:780,whiteSpace:'nowrap',letterSpacing:-1}}>{r.name}</div><div style={{borderLeft:`1px solid ${i===0?'#d99d8b':C.line}`,paddingLeft:17}}><div style={{fontSize:17,fontFamily:mono,opacity:.8}}>ECI</div><span style={{fontFamily:mono,fontSize:57,fontWeight:700}}>{r.eci.toFixed(2)}</span></div></Reveal>)}</div>
 <div style={{...xy(1073,395,770),borderLeft:`1px solid ${C.line}`,paddingLeft:27}}><div style={{height:32,display:'grid',gridTemplateColumns:'45px 42px 1fr 91px',gap:11,fontSize:18,color:C.muted,fontFamily:mono}}><span>#</span><span/><span>模型名称</span><span style={{textAlign:'right'}}>ECI</span></div>{rows.slice(3).map((r,i)=><Reveal at={.25+i*.035} key={r.id} style={{height:39,display:'grid',gridTemplateColumns:'45px 42px 1fr 91px',gap:11,alignItems:'center',borderBottom:`1px solid ${C.line}`,fontSize:26}}><span style={{fontFamily:mono,fontSize:23}}>{String(i+4).padStart(2,'0')}</span><Logo file={r.icon} size={27}/><span style={{whiteSpace:'nowrap',fontWeight:550}}>{r.name}</span><span style={{fontFamily:mono,fontSize:24,textAlign:'right'}}>{r.eci.toFixed(2)}</span></Reveal>)}</div>
</Frame>;};
