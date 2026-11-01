import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mixAudio } from "../skills/audio-post/scripts/mix.mjs";
import { mediaCommand, probeMedia } from "../scripts/lib/media.mjs";
import { hashFile } from "../scripts/lib/files.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "vibe-audio-"));
  for (const [file, filter] of [["voice.wav", "sine=frequency=1200:duration=3:sample_rate=48000"], ["music.wav", "sine=frequency=220:duration=1:sample_rate=48000"]])
    mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", filter, "-y", join(root, file)]);
  const config = { schemaVersion: 1, duration: 6, ducking: { threshold: 0.01, ratio: 12 }, tracks: [
    { role: "voice", file: "voice.wav", start: 1 },
    { role: "music", file: "music.wav", loop: true, gainDb: -8, fadeIn: 0.1, fadeOut: 0.1 },
  ] };
  const put = () => writeFileSync(join(root, "audio.json"), JSON.stringify(config));
  put(); return { root, config, put };
}
function musicRms(file, start) {
  const buffer = mediaCommand("ffmpeg", ["-v", "error", "-ss", String(start), "-t", "0.5", "-i", file,
    "-af", "lowpass=f=330,lowpass=f=330,highpass=f=100", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], { encoding: null }).stdout;
  let energy = 0;
  for (let i = 0; i < buffer.length; i += 4) energy += buffer.readFloatLE(i) ** 2;
  return Math.sqrt(energy / (buffer.length / 4));
}
test("audio processing produces measured stereo output, preserves sources and stays pending listening", () => {
  const f = fixture(), hash = hashFile(join(f.root, "voice.wav"));
  const report = mixAudio(f.root);
  assert.equal(report.ok, true, report.errors.join(";"));
  assert.equal(report.duckingApplied, true);
  assert.equal(report.humanReview.status, "pending");
  assert.equal(hashFile(join(f.root, "voice.wav")), hash);
  assert.equal(hashFile(join(f.root, "audio/mix.wav")), report.outputSha256);
  assert.ok(Math.abs(Number(report.after.input_i) + 16) < 1.5);
  assert.ok(Number(report.after.input_tp) <= -1.2);
  const meta = probeMedia(join(f.root, "audio/mix.wav"));
  assert.equal(meta.streams[0].channels, 2);
  assert.ok(Math.abs(meta.duration - 6) < 0.02);
});
test("music actually ducks during voice and recovers after it, rather than only reporting a flag", () => {
  const f = fixture(); f.config.normalize = false; f.put();
  mixAudio(f.root, { out: "duck.wav" });
  f.config.ducking = false; f.put(); mixAudio(f.root, { out: "flat.wav" });
  assert.ok(musicRms(join(f.root, "duck.wav"), 2) < musicRms(join(f.root, "flat.wav"), 2) * 0.55);
  assert.ok(musicRms(join(f.root, "duck.wav"), 5) > musicRms(join(f.root, "flat.wav"), 5) * 0.85);
});
test("audio rejects source overwrite, implicit truncation, traversal and silent normalization", () => {
  const f = fixture();
  assert.throws(() => mixAudio(f.root, { out: "voice.wav" }), /overwrite an input/);
  f.config.duration = 2; f.put(); assert.throws(() => mixAudio(f.root), /exceeds|track.duration/);
  f.config.duration = 6; f.config.tracks[0].file = "../voice.wav"; f.put();
  assert.throws(() => mixAudio(f.root), /Unsafe/);
  f.config.tracks[0].file = "voice.wav"; f.config.tracks[0].gainDb = 24; f.config.normalize = false; f.put();
  assert.throws(() => mixAudio(f.root), /would clip/);
  mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "2", "-y", join(f.root, "silent.wav")]);
  f.config.tracks = [{ role: "voice", file: "silent.wav" }]; f.put();
  assert.throws(() => mixAudio(f.root), /silent|too short/);
  assert.equal(existsSync(join(f.root, "audio/mix.wav")), false);
});

test("optional voice denoising reduces stationary noise without muting the signal or changing its clock", () => {
  const root = mkdtempSync(join(tmpdir(), "vibe-denoise-"));
  const source = join(root, "noisy.wav");
  mediaCommand("ffmpeg", ["-v", "error", "-f", "lavfi", "-i", "sine=frequency=1200:duration=3.5:sample_rate=48000",
    "-f", "lavfi", "-i", "anoisesrc=color=white:amplitude=0.02:duration=5:sample_rate=48000:seed=37",
    "-filter_complex", "[0:a]adelay=1500,apad=whole_dur=5[tone];[tone][1:a]amix=inputs=2:normalize=0,atrim=duration=5",
    "-y", source]);
  const before = hashFile(source);
  const config = {schemaVersion:1, duration:5, normalize:false, ducking:false,
    tracks:[{role:"voice",file:"noisy.wav",denoise:{reductionDb:10,noiseFloorDb:-35}}]};
  const put = () => writeFileSync(join(root,"audio.json"), JSON.stringify(config));
  const rms = (file, start, filter = "anull") => {
    const bytes = mediaCommand("ffmpeg",["-v","error","-ss",String(start),"-i",file,"-t","0.5","-af",filter,"-ac","1","-ar","48000","-f","f32le","-"],{encoding:null}).stdout;
    let sum=0; for(let i=0;i<bytes.length;i+=4) sum+=bytes.readFloatLE(i)**2;
    return Math.sqrt(sum/(bytes.length/4));
  };
  put(); const processed=mixAudio(root,{out:"denoised.wav"});
  config.tracks[0].denoise=false;put();mixAudio(root,{out:"baseline.wav"});
  const clean=join(root,"denoised.wav"),base=join(root,"baseline.wav");
  assert.ok(rms(clean,.5)<rms(base,.5)*.65,"quiet-region noise must measurably fall");
  const band="highpass=f=1100,lowpass=f=1300";
  const signalRatio=rms(clean,2,band)/rms(base,2,band);
  assert.ok(signalRatio>.85&&signalRatio<1.1,"retained test tone must not be muted or amplified");
  assert.ok(rms(clean,4.5,band)>rms(base,4.5,band)*.85,"the final speech samples must survive filter flushing");
  const onset = (file) => {
    const bytes=mediaCommand("ffmpeg",["-v","error","-i",file,"-ac","1","-ar","48000","-f","f32le","-"],{encoding:null}).stdout;
    for(let i=67200;i<86400;i++) if(Math.abs(bytes.readFloatLE(i*4))>.06) return i/48000;
    throw Error("Test signal onset not found");
  };
  assert.ok(Math.abs(onset(clean)-onset(base))<.002,"denoising must not delay words against existing subtitles");
  assert.equal(hashFile(source),before);
  assert.ok(Math.abs(probeMedia(clean).duration-5)<.02);
  assert.deepEqual(processed.inputs[0].denoise,{reductionDb:10,noiseFloorDb:-35});
  assert.equal(processed.inputs[0].denoiseDelayCompensationSamples,1200);
  assert.equal(processed.humanReview.status,"pending");
  for(const bad of [true, [], null, {reductionDb:0}, {noiseFloorDb:-100}, {unexpected:1}]) {
    config.tracks[0].denoise=bad;put();assert.throws(()=>mixAudio(root),/denoise/);
  }
  config.tracks[0].denoise={};config.tracks[0].role="music";put();
  assert.throws(()=>mixAudio(root),/voice track/);
});
