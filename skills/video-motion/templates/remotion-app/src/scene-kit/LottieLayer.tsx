import React from "react";
import { Lottie, getLottieMetadata } from "@remotion/lottie";
import { cancelRender, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";

type LayerProps = {
  animationData?: object;
  src?: string; // Relative to this project's public directory.
  width: number;
  height?: number;
  loop?: boolean; // Preserve the existing wrapper default: true.
  playbackRate?: number; // Original-speed multiplier; wrapper converts for the pinned renderer.
  delay?: number; // Seconds, relative to the enclosing sequence.
  style?: React.CSSProperties;
};
type FrameProps = Omit<LayerProps, "src"> & { animationData: object };

const LottieFrame: React.FC<FrameProps> = ({ animationData, width, height, loop = true, playbackRate = 1, delay = 0, style }) => {
  const { fps } = useVideoConfig();
  if (!Number.isFinite(delay) || delay < 0 || !Number.isFinite(playbackRate) || playbackRate <= 0)
    throw new Error("LottieLayer needs a nonnegative delay and positive playbackRate");
  const metadata = getLottieMetadata(animationData as Parameters<typeof getLottieMetadata>[0]);
  if (!metadata || !Number.isFinite(metadata.fps) || metadata.fps <= 0)
    throw new Error("LottieLayer needs valid animation frame rate metadata");
  // @remotion/lottie 4.0.533 advances asset frames from composition frames.
  const nativeRate = playbackRate * metadata.fps / fps;
  return (
    <div style={style}>
      <Sequence from={Math.round(delay * fps)} layout="none">
        <Lottie
          animationData={animationData as Parameters<typeof Lottie>[0]["animationData"]}
          loop={loop}
          playbackRate={nativeRate}
          style={{ width, height: height ?? width }}
        />
      </Sequence>
    </div>
  );
};

const RemoteLottie: React.FC<Omit<LayerProps, "animationData"> & { src: string }> = ({ src, ...props }) => {
  const [data, setData] = React.useState<object | null>(null);
  const [initialHandle] = React.useState(() => delayRender(`LottieLayer: ${src}`));
  React.useEffect(() => {
    // Each effect owns its wait handle, including React's development remounts.
    const handle = delayRender(`LottieLayer: loading ${src}`);
    continueRender(initialHandle);
    const controller = new AbortController();
    let active = true;
    fetch(staticFile(src), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`LottieLayer: ${src} returned HTTP ${response.status}`);
        return response.json();
      })
      .then((animation: unknown) => {
        if (!animation || typeof animation !== "object" || Array.isArray(animation))
          throw new Error(`LottieLayer: ${src} is not an animation object`);
        if (!active) return;
        setData(animation);
        continueRender(handle);
      })
      .catch((error: unknown) => {
        if (active) cancelRender(error instanceof Error ? error : new Error(String(error)));
      });
    return () => { active = false; controller.abort(); continueRender(handle); };
  }, [src, initialHandle]);
  return data ? <LottieFrame {...props} animationData={data} /> : null;
};

export const LottieLayer: React.FC<LayerProps> = ({ animationData, src, ...props }) => {
  if (animationData) return <LottieFrame {...props} animationData={animationData} />;
  if (!src) throw new Error("LottieLayer requires animationData or src");
  // A source change remounts the loader instead of showing a previous asset.
  return <RemoteLottie key={src} src={src} {...props} />;
};
