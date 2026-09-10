/**
 * Smoke test for Phase 3 electrical topology (run with: node scripts/smoke-electrical.mjs)
 * Uses dynamic import against the Vite-built path via tsx alternative: compile inline checks
 * by spawning vite-node if available; otherwise prints skip.
 */

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const viteNode = path.join(root, "node_modules", "vite-node", "vite-node.mjs");
const runner = path.join(root, "scripts", "smoke-electrical-runner.ts");

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", runner],
  { cwd: root, encoding: "utf8", env: process.env },
);

if (result.error || result.status !== 0) {
  // Fallback: use vite to evaluate via jiti if present
  const jitiBin = path.join(root, "node_modules", ".bin", "jiti");
  const alt = spawnSync(jitiBin, [runner], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  process.stdout.write(alt.stdout || "");
  process.stderr.write(alt.stderr || "");
  process.exit(alt.status ?? 1);
}

process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.status ?? 0);
