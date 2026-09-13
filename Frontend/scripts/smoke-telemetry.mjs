/**
 * Smoke test for Phase 4 live telemetry.
 * Run: node scripts/smoke-telemetry.mjs
 */

import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const runner = path.join(root, "scripts", "smoke-telemetry-runner.ts");

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", runner],
  { cwd: root, encoding: "utf8", env: process.env },
);

if (result.error || result.status !== 0) {
  const viteNode = path.join(root, "node_modules", ".bin", "vite-node");
  const alt = spawnSync(viteNode, [runner], {
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
