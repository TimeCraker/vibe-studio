import { registerRoot } from "remotion";
import { MgDemoRoot } from "../src/mg-demos";

// MG 武器库 demo 独立入口:不进 Root.tsx(七组合契约零改动),沿用 lekao demo-index.ts 先例。
// 渲染:npx remotion render remotion/mg-index.ts MgUtilityDemo <out>.mp4
registerRoot(MgDemoRoot);
