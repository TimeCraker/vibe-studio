import React from "react";
import { Lottie, getLottieMetadata } from "@remotion/lottie";
import { continueRender, delayRender, staticFile, useVideoConfig } from "remotion";

// Lottie 资产层(@remotion/lottie):吃 AE 生态的成品动效(LottieFiles 免费商用库 / assets/lottie/)。
// 确定性铁律(4.0.518 事实):
// - <Lottie> 只吃 animationData 对象;src 路径模式由本组件 fetch + delayRender 装载
// - playbackRate 必须 = 合成 fps / lottie fr,否则播放速度失真
// - **intake 禁带 expressions 的 JSON**(逐帧闪烁,渲染不确定);下载时人工确认
export const LottieLayer: React.FC<{
  animationData?: object; // 内联动画对象(优先,零 IO)
  src?: string; // staticFile 相对路径(assets/lottie 复制进项目 public/ 后用)
  width: number;
  height?: number; // 默认 = width
  loop?: boolean; // 默认 true
  playbackRate?: number; // 默认自动 = compFps / lottieFps
  delay?: number; // s,起始延迟(组件只控制挂载时机)
  style?: React.CSSProperties;
}> = ({ animationData, src, width, height, loop = true, playbackRate, delay = 0, style }) => {
  const { fps } = useVideoConfig();
  const [fetched, setFetched] = React.useState<object | null>(animationData ?? null);
  const [handle] = React.useState(() =>
    src && !animationData ? delayRender(`LottieLayer: loading ${src}`) : null,
  );

  React.useEffect(() => {
    if (!src || animationData) return;
    let alive = true;
    fetch(staticFile(src))
      .then((r) => r.json())
      .then((data: object) => {
        if (!alive) return;
        setFetched(data);
        if (handle !== null) continueRender(handle);
      })
      .catch(() => {
        console.warn(`[LottieLayer] ${src} load failed`);
        if (handle !== null) continueRender(handle);
      });
    return () => {
      alive = false;
    };
  }, [src, animationData, handle]);

  if (!fetched) return null;
  const meta = getLottieMetadata(fetched as Parameters<typeof getLottieMetadata>[0]);
  const rate = playbackRate ?? (meta ? fps / meta.fps : 1);

  return (
    <div style={{ opacity: delay > 0 ? 0 : 1, ...style }}>
      {delay > 0 ? null : (
        <Lottie
          animationData={fetched as Parameters<typeof Lottie>[0]["animationData"]}
          loop={loop}
          playbackRate={rate}
          style={{ width, height: height ?? width }}
        />
      )}
    </div>
  );
};
