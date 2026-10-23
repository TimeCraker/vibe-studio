import { spawn } from "node:child_process";
import {
  appendFileSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  rmSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { archiveSkip } from "./archive.mjs";
import {
  hashFile,
  hashValue,
  readJson,
  safePath,
  walk,
  writeJson,
} from "./files.mjs";

export function validateJob(job) {
  if (
    job?.schemaVersion !== 1 ||
    !Array.isArray(job.steps) ||
    !job.steps.length
  )
    throw new Error("job.json needs schemaVersion=1 and steps");
  const ids = new Set();
  for (const step of job.steps) {
    if (!/^[a-z][a-z0-9-]*$/.test(step.id) || ids.has(step.id))
      throw new Error("Invalid/duplicate job step id");
    ids.add(step.id);
    if (
      !Array.isArray(step.command) ||
      !step.command.length ||
      step.command.some((s) => typeof s !== "string" || !s)
    )
      throw new Error(`Invalid command: ${step.id}`);
    if (
      !Array.isArray(step.inputs) ||
      !Array.isArray(step.outputs) ||
      [...step.inputs, ...step.outputs].some((s) => typeof s !== "string" || !s)
    )
      throw new Error(`Invalid input/output declarations: ${step.id}`);
    if (
      step.timeoutSeconds !== undefined &&
      (!Number.isFinite(step.timeoutSeconds) || step.timeoutSeconds <= 0)
    )
      throw new Error(`Invalid timeout: ${step.id}`);
  }
  return job;
}
function digestPaths(project, paths) {
  return paths.map((rel) => {
    const path = safePath(project, rel);
    if (!existsSync(path)) throw new Error(`Missing declared file: ${rel}`);
    if (lstatSync(path).isDirectory())
      return [
        rel,
        walk(path, archiveSkip).map((name) => [
          name,
          hashFile(safePath(path, name)),
        ]),
      ];
    return [rel, hashFile(path)];
  });
}
export function commandArgs(command, repo, project) {
  let [exe, ...args] = command.map((s) =>
    s.replaceAll("{repo}", repo).replaceAll("{project}", project),
  );
  if (exe === "node") exe = process.execPath;
  if (process.platform === "win32" && ["npm", "npx"].includes(exe)) {
    const cli = resolve(
      dirname(process.execPath),
      "node_modules/npm/bin",
      `${exe}-cli.js`,
    );
    if (!existsSync(cli))
      throw new Error(`Cannot locate ${exe} CLI next to Node`);
    args = [cli, ...args];
    exe = process.execPath;
  }
  return { exe, args };
}
export function runCommand(
  command,
  { cwd, repo, project, timeoutMs = 600000, logPath, quiet = false } = {},
) {
  const { exe, args } = commandArgs(command, repo, project);
  return new Promise((done) => {
    const child = spawn(exe, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    let timedOut = false,
      settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32") {
        const killer = spawn(
          "taskkill.exe",
          ["/pid", String(child.pid), "/t", "/f"],
          { windowsHide: true, stdio: "ignore" },
        );
        killer.on("error", () => child.kill());
      } else child.kill("SIGTERM");
    }, timeoutMs);
    for (const name of ["stdout", "stderr"])
      child[name].on("data", (bytes) => {
        if (logPath) appendFileSync(logPath, bytes);
        if (!quiet) process[name].write(bytes);
      });
    child.once("error", (error) => finish({ code: 1, error: error.message }));
    child.once("close", (code, signal) =>
      finish({ code: timedOut ? 124 : (code ?? 1), signal, timedOut }),
    );
  });
}
export async function runJob(
  project,
  repo,
  { step: selected, from, dry = false, quiet = false } = {},
) {
  project = resolve(project);
  repo = resolve(repo);
  const job = validateJob(readJson(join(project, "job.json")));
  if (selected && from) throw new Error("Choose --step or --from");
  const start = from ? job.steps.findIndex((s) => s.id === from) : 0;
  if (start < 0 || (selected && !job.steps.some((s) => s.id === selected)))
    throw new Error("Unknown step");
  const steps = selected
    ? job.steps.filter((s) => s.id === selected)
    : job.steps.slice(start);
  // Validate all file boundaries before starting any command.
  for (const s of job.steps) {
    for (const path of [...s.inputs, ...s.outputs]) safePath(project, path);
    if (s.cwd) safePath(project, s.cwd);
  }
  if (dry)
    return {
      dry: true,
      steps: steps.map((s) => ({
        id: s.id,
        ...commandArgs(s.command, repo, project),
      })),
    };
  const stateDir = join(project, ".studio");
  mkdirSync(join(stateDir, "logs"), { recursive: true });
  const lock = join(stateDir, "run.lock");
  let fd;
  try {
    fd = openSync(lock, "wx");
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "A run lock exists; verify the previous run stopped before removing .studio/run.lock",
      );
    throw error;
  }
  const statePath = join(stateDir, "state.json");
  const summary = { completed: [], cached: [] };
  try {
    const state = existsSync(statePath)
      ? readJson(statePath)
      : { schemaVersion: 1, steps: {} };
    if (!state.steps || typeof state.steps !== "object")
      throw new Error("Invalid run state");
    const engine = hashValue(
      ["scripts", "skills"]
        .filter((dir) => existsSync(join(repo, dir)))
        .map((dir) => [
          dir,
          walk(join(repo, dir), archiveSkip).map((path) => [
            path,
            hashFile(safePath(join(repo, dir), path)),
          ]),
        ]),
    );
    writeJson(join(stateDir, "owner.json"), {
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });
    for (const s of steps) {
      const tools = s.command
        .map((arg) =>
          arg.replaceAll("{repo}", repo).replaceAll("{project}", project),
        )
        .filter((path) => existsSync(path));
      const toolHashes = tools.flatMap((path) => {
        try {
          return [[path, hashFile(path)]];
        } catch {
          return [];
        }
      });
      let fingerprint;
      try {
        fingerprint = hashValue({
          step: s,
          node: process.version,
          engine,
          inputs: digestPaths(project, s.inputs),
          tools: toolHashes,
        });
      } catch (error) {
        state.steps[s.id] = { status: "failed", error: error.message };
        writeJson(statePath, state);
        throw error;
      }
      const prior = state.steps[s.id];
      let outputs;
      try {
        outputs = digestPaths(project, s.outputs);
      } catch {
        outputs = null;
      }
      if (
        s.outputs.length &&
        prior?.status === "complete" &&
        prior.fingerprint === fingerprint &&
        outputs &&
        hashValue(outputs) === prior.outputHash
      ) {
        summary.cached.push(s.id);
        if (!quiet) console.log(`CACHED ${s.id}`);
        continue;
      }
      state.steps[s.id] = {
        status: "running",
        fingerprint,
        startedAt: new Date().toISOString(),
      };
      writeJson(statePath, state);
      const result = await runCommand(s.command, {
        repo,
        project,
        cwd: s.cwd ? safePath(project, s.cwd) : project,
        timeoutMs: (s.timeoutSeconds ?? 600) * 1000,
        logPath: join(stateDir, "logs", `${s.id}.log`),
        quiet,
      });
      try {
        if (result.code !== 0)
          throw new Error(
            `Step ${s.id} failed: exit ${result.code}${result.error ? ` ${result.error}` : ""}`,
          );
        outputs = digestPaths(project, s.outputs);
        state.steps[s.id] = {
          ...state.steps[s.id],
          status: "complete",
          finishedAt: new Date().toISOString(),
          outputHash: hashValue(outputs),
        };
        summary.completed.push(s.id);
      } catch (error) {
        state.steps[s.id] = {
          ...state.steps[s.id],
          status: "failed",
          error: error.message,
        };
        writeJson(statePath, state);
        throw error;
      }
      writeJson(statePath, state);
    }
    return summary;
  } finally {
    closeSync(fd);
    rmSync(lock, { force: true });
  }
}
