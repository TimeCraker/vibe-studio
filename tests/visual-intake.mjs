// Focused Remotion fixture using the pinned template and existing local Chrome.
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { commandArgs } from "../scripts/lib/runner.mjs";
import { hashFile, readJson, writeJson } from "../scripts/lib/files.mjs";
import { mediaCommand } from "../scripts/lib/media.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = join(repo, "skills/video-motion/templates/remotion-app"), fixture = join(repo, ".cache/visual-intake");
const layer = "src/scene-kit/LottieLayer.tsx";
cpSync(template, fixture, { recursive: true, filter: (path) => !path.split(/[\\/]/).some((part) => ["node_modules", ".baseline", "out", "dist"].includes(part)) });
const versions = readJson(join(template, "package.json")).dependencies;
const stale = ["remotion", "@remotion/lottie", "@remotion/three", "@remotion/cli"].some((name) => {
  const path = join(fixture, "node_modules", name, "package.json");
  return !existsSync(path) || readJson(path).version !== versions[name];
});
if (stale || !existsSync(join(fixture, "node_modules/@remotion/renderer/package.json"))) {
  const { exe, args } = commandArgs(["npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund"], repo, fixture);
  mediaCommand(exe, args, { cwd: fixture });
}
assert.equal(hashFile(join(template, layer)), hashFile(join(fixture, layer)));
mkdirSync(join(fixture, "public/lottie"), { recursive: true });
cpSync(join(repo, "assets/lottie/spin-ring.json"), join(fixture, "public/lottie/spin-ring.json"));
writeFileSync(join(fixture, "src/VisualIntake.tsx"), `
import React from 'react';
import {AbsoluteFill, Composition, useCurrentFrame, registerRoot} from 'remotion';
import {LottieLayer} from './scene-kit/LottieLayer';
import {ThreeStage} from './scene-kit/ThreeStage';
import animationData from '../public/lottie/spin-ring.json';
const Ring: React.FC<{delay?:number;src?:string;loop?:boolean;rate?:number}> = ({delay=0,src,loop=false,rate=1}) => <AbsoluteFill style={{background:'#18202b'}}><LottieLayer {...(src?{src}:{animationData})} width={200} loop={loop} playbackRate={rate} delay={delay}/></AbsoluteFill>;
const Product = () => {const f=useCurrentFrame();return <AbsoluteFill style={{background:'#18202b'}}><ThreeStage width={200} height={200}><mesh rotation={[0.3,f*0.03,0]}><boxGeometry args={[1.8,1.2,0.8]}/><meshStandardMaterial color="#d49a52"/></mesh></ThreeStage></AbsoluteFill>};
const Root=()=> <>
<Composition id="Thirty" component={Ring} durationInFrames={90} width={200} height={200} fps={30}/>
<Composition id="Sixty" component={Ring} durationInFrames={180} width={200} height={200} fps={60}/>
<Composition id="Delayed" component={Ring} defaultProps={{delay:0.5}} durationInFrames={180} width={200} height={200} fps={60}/>
<Composition id="Remote" component={Ring} defaultProps={{src:'lottie/spin-ring.json'}} durationInFrames={90} width={200} height={200} fps={30}/>
<Composition id="Missing" component={Ring} defaultProps={{src:'missing-source.json'}} durationInFrames={90} width={200} height={200} fps={30}/>
<Composition id="Looping" component={Ring} defaultProps={{loop:true}} durationInFrames={240} width={200} height={200} fps={60}/>
<Composition id="DoubleSpeed" component={Ring} defaultProps={{rate:2}} durationInFrames={180} width={200} height={200} fps={60}/>
<Composition id="Product" component={Product} durationInFrames={90} width={200} height={200} fps={30}/>
</>;
registerRoot(Root);
`, "utf8");
mediaCommand(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], { cwd: fixture });
const require = createRequire(join(fixture, "package.json"));
const { bundle } = require("@remotion/bundler"), { getCompositions, renderStill } = require("@remotion/renderer");
const chrome = process.env.CHROME_PATH || (process.platform === "win32" ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : "/usr/bin/google-chrome");
if (!existsSync(chrome)) throw new Error("Set CHROME_PATH to an existing local Chrome; this fixture does not download a browser");
const serveUrl = await bundle({ entryPoint: join(fixture, "src/VisualIntake.tsx"), publicDir: join(fixture, "public"), outDir: join(fixture, ".bundle") });
const options = { serveUrl, browserExecutable: chrome, chromiumOptions: { gl: "swiftshader" }, timeoutInMilliseconds: 10000, logLevel: "error" };
const compositions = await getCompositions(serveUrl, options);
const outDir = join(fixture, "evidence"); mkdirSync(outDir, { recursive: true });
async function still(id, frame, name) {
  const output = join(outDir, `${name}.png`);
  await renderStill({ ...options, composition: compositions.find((c) => c.id === id), frame, output });
  return output;
}
const pixels = (path) => mediaCommand("ffmpeg", ["-v", "error", "-i", path, "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], { encoding: null }).stdout;
const thirty = await still("Thirty", 15, "thirty-half-second"), sixty = await still("Sixty", 30, "sixty-half-second");
assert.ok(pixels(thirty).equals(pixels(sixty)), "Same wall-clock time must not change speed across FPS");
const start = await still("Sixty", 0, "start"), before = await still("Delayed", 29, "before-delay"), delayed = await still("Delayed", 30, "at-delay");
assert.ok(!pixels(before).equals(pixels(start)), "Delayed layer must be hidden before its start");
assert.ok(pixels(delayed).equals(pixels(start)), "Delayed layer must start at its local frame zero");
assert.ok(pixels(await still("Remote", 15, "remote")).equals(pixels(thirty)), "Local src and inline data must match");
assert.ok(pixels(await still("Looping", 180, "loop-restart")).equals(pixels(start)), "A 3-second asset must loop at 3 seconds even at 60fps");
assert.ok(pixels(await still("DoubleSpeed", 15, "double-speed")).equals(pixels(thirty)), "playbackRate must remain an original-speed multiplier");
await assert.rejects(still("Missing", 0, "missing"), /LottieLayer.*HTTP 404/);
const productA = await still("Product", 0, "product-start"), productB = await still("Product", 20, "product-turn");
assert.ok(!pixels(productA).equals(pixels(productB)), "3D motion must actually change between frames");
const result = { ok: true, fixture, sourceSha256: hashFile(join(template, layer)), pinnedRemotion: versions.remotion, typecheck: true,
  fpsInvariant: true, delayedLocalTimeline: true, missingAssetRejected: true, localSourceMatchesInline: true, frameDriven3D: true,
  loopTiming: true, speedMultiplier: true, evidence: outDir, humanReview: "pending", modelDownloads: false };
writeJson(join(repo, ".cache/verification/visual-intake.json"), result);
console.log(JSON.stringify(result, null, 2));
