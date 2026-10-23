#!/usr/bin/env node
// Project adapter. Shared source belongs to config/workspace-tools; npm pins its release.
try {
  await import("@timecraker/workspace-docs/cli");
} catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND" && error.message.includes("@timecraker/workspace-docs")) {
    console.error("docs: install the pinned offline dependency: npm ci --ignore-scripts --no-audit --no-fund");
    process.exitCode = 1;
  } else throw error;
}
