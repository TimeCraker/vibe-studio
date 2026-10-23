import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runJob } from "../scripts/lib/runner.mjs";
test("input edits, output edits and missing outputs invalidate cache; resume skips unchanged work", async () => {
  const dir = mkdtempSync(join(tmpdir(), "vibe-runner-"));
  writeFileSync(join(dir, "input.txt"), "first");
  writeFileSync(
    join(dir, "build.mjs"),
    "import{readFileSync,writeFileSync}from'node:fs';writeFileSync('output.txt',readFileSync('input.txt'))",
  );
  writeFileSync(
    join(dir, "job.json"),
    JSON.stringify({
      schemaVersion: 1,
      steps: [
        {
          id: "build",
          command: ["node", "build.mjs"],
          inputs: ["input.txt", "build.mjs"],
          outputs: ["output.txt"],
        },
      ],
    }),
  );
  assert.deepEqual(
    (await runJob(dir, resolve("."), { quiet: true })).completed,
    ["build"],
  );
  assert.deepEqual((await runJob(dir, resolve("."), { quiet: true })).cached, [
    "build",
  ]);
  writeFileSync(join(dir, "input.txt"), "second");
  await runJob(dir, resolve("."), { quiet: true });
  assert.equal(readFileSync(join(dir, "output.txt"), "utf8"), "second");
  writeFileSync(join(dir, "output.txt"), "tampered");
  assert.deepEqual(
    (await runJob(dir, resolve("."), { quiet: true })).completed,
    ["build"],
  );
  rmSync(join(dir, "output.txt"));
  assert.deepEqual(
    (await runJob(dir, resolve("."), { quiet: true })).completed,
    ["build"],
  );
});
test("failed step stops downstream; timeout is recorded; dry run executes nothing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "vibe-runner-failure-"));
  writeFileSync(
    join(dir, "job.json"),
    JSON.stringify({
      schemaVersion: 1,
      steps: [
        {
          id: "wait",
          command: ["node", "-e", "setTimeout(()=>{},5000)"],
          inputs: [],
          outputs: [],
          timeoutSeconds: 0.1,
        },
        {
          id: "later",
          command: ["node", "-e", "process.exit(0)"],
          inputs: [],
          outputs: [],
        },
      ],
    }),
  );
  assert.equal(
    (await runJob(dir, resolve("."), { dry: true })).steps.length,
    2,
  );
  await assert.rejects(runJob(dir, resolve("."), { quiet: true }), /124/);
  const state = JSON.parse(readFileSync(join(dir, ".studio/state.json")));
  assert.equal(state.steps.wait.status, "failed");
  assert.equal(state.steps.later, undefined);
});
