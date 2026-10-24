import React from "react";
import { Composition, Still, registerRoot } from "remotion";
import { DailyRework, DailyReworkCover, REWORK_SECONDS } from "../src/DailyRework";

const ReworkRoot: React.FC = () => (
  <>
    <Composition id="DailyRework" component={DailyRework} durationInFrames={REWORK_SECONDS * 60} fps={60} width={1920} height={1080} />
    <Still id="DailyReworkCover" component={DailyReworkCover} width={1920} height={1080} />
  </>
);

registerRoot(ReworkRoot);
