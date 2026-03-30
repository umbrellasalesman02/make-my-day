import { spawn } from "node:child_process";
import { ensureBunIsInstalled, getAccessUrls, resolveConfig } from "./env.js";

function printStartupSummary(
  host: string,
  port: number,
  token: string,
  tailscaleIp: string | null,
): void {
  const urls = getAccessUrls(host, port, tailscaleIp);
  console.log("[agent-gui] Starting T3 Code remote server");
  console.log(`[agent-gui] Local URL:   ${urls.local}`);
  console.log(`[agent-gui] Bound URL:   ${urls.host}`);
  if (urls.tailnet) {
    console.log(`[agent-gui] Tailnet URL: ${urls.tailnet}`);
  } else {
    console.warn(
      "[agent-gui] Tailscale IPv4 not detected. Falling back to localhost unless T3CODE_HOST is set.",
    );
  }
  console.log(`[agent-gui] Auth token: ${token}`);
}

function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed (${command} ${args.join(" ")}), exit code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const preflight = args.has("--preflight");
  const skipBuild = args.has("--skip-build");

  ensureBunIsInstalled();
  const config = await resolveConfig(process.env);

  printStartupSummary(config.host, config.port, config.token, config.tailscaleIp);

  if (preflight) {
    console.log("[agent-gui] Preflight checks passed.");
    return;
  }

  if (!skipBuild) {
    await runCommand("bun", ["run", "build"], config.t3RepoDir);
  }

  const child = spawn(
    "bun",
    [
      "run",
      "--cwd",
      "apps/server",
      "start",
      "--",
      "--host",
      config.host,
      "--port",
      String(config.port),
      "--auth-token",
      config.token,
      "--no-browser",
    ],
    {
      cwd: config.t3RepoDir,
      stdio: "inherit",
      env: process.env,
    },
  );

  const stop = (signal: NodeJS.Signals) => {
    child.kill(signal);
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  await new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`t3 server exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[agent-gui] ${message}`);
  process.exit(1);
});
