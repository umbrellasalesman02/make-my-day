import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { detectTailscaleIpv4 } from "./env.js";

async function firstReadablePath(candidates: readonly string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.R_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

function runWithEnv(env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["dist/start.js"], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`agent-gui start failed with exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function main(): Promise<void> {
  const tailnetIp = detectTailscaleIpv4();
  const guessedRepo = await firstReadablePath([
    join(homedir(), "dev", "t3code"),
    join(homedir(), "code", "t3code"),
    join(homedir(), "src", "t3code"),
  ]);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    BUN_BIN: process.env.BUN_BIN || "bun",
    T3CODE_PORT: process.env.T3CODE_PORT || "3773",
    T3CODE_HOST: process.env.T3CODE_HOST || tailnetIp || "127.0.0.1",
    T3CODE_AUTH_TOKEN: process.env.T3CODE_AUTH_TOKEN || randomBytes(24).toString("hex"),
    T3CODE_REPO_DIR: process.env.T3CODE_REPO_DIR || guessedRepo || "",
  };

  if (!env.T3CODE_REPO_DIR) {
    throw new Error(
      "Could not infer T3CODE_REPO_DIR. Set T3CODE_REPO_DIR and rerun `vp run agent-gui:remote`.",
    );
  }

  console.log("[agent-gui] Auto-start mode");
  console.log(`[agent-gui] T3CODE_REPO_DIR=${env.T3CODE_REPO_DIR}`);
  console.log(`[agent-gui] T3CODE_HOST=${env.T3CODE_HOST}`);
  console.log(`[agent-gui] T3CODE_PORT=${env.T3CODE_PORT}`);
  console.log(`[agent-gui] BUN_BIN=${env.BUN_BIN}`);

  await runWithEnv(env);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[agent-gui] ${message}`);
  process.exit(1);
});
