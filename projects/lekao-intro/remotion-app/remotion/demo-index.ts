import { registerRoot } from "remotion";
import { KitDemoRoot } from "../src/kit-demos";

// scene-kit 零件 demo 独立入口：不进 Root.tsx（v1 存量零改动）。
// 渲染：npx remotion render remotion/demo-index.ts kit-basics <out>.mp4
registerRoot(KitDemoRoot);
