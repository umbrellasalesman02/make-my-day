import { spawn } from "node:child_process";
import { ensureBunIsInstalled, getAccessUrls, resolveConfig } from "./env.js";

function printStartupSummary(
  bunBin: string,
  host: string,
  port: number,
  token: string,
  disableAuth: boolean,
  wsUrl: string,
  projectRoot: string,
  autoBootstrapProjectFromCwd: boolean,
  logWebSocketEvents: boolean,
  tailscaleIp: string | null,
): void {
  const urls = getAccessUrls(host, port, tailscaleIp);
  console.log("[agent-gui] Starting T3 Code remote server");
  console.log(`[agent-gui] Bun binary:  ${bunBin}`);
  console.log(`[agent-gui] Project root: ${projectRoot}`);
  console.log(`[agent-gui] Local URL:   ${urls.local}`);
  console.log(`[agent-gui] Bound URL:   ${urls.host}`);
  if (urls.tailnet) {
    console.log(`[agent-gui] Tailnet URL: ${urls.tailnet}`);
  } else {
    console.warn(
      "[agent-gui] Tailscale IPv4 not detected. Falling back to localhost unless T3CODE_HOST is set.",
    );
  }
  console.log(`[agent-gui] Auth mode:  ${disableAuth ? "disabled (debug)" : "enabled"}`);
  if (!disableAuth) {
    console.log(`[agent-gui] Auth token: ${token}`);
  }
  console.log(`[agent-gui] VITE_WS_URL: ${wsUrl}`);
  console.log(`[agent-gui] Auto-bootstrap: ${autoBootstrapProjectFromCwd ? "on" : "off"}`);
  console.log(`[agent-gui] WS event logs: ${logWebSocketEvents ? "on" : "off"}`);
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

  const config = await resolveConfig(process.env);
  ensureBunIsInstalled(config.bunBin);

  printStartupSummary(
    config.bunBin,
    config.host,
    config.port,
    config.token,
    config.disableAuth,
    config.wsUrl,
    config.projectRoot,
    config.autoBootstrapProjectFromCwd,
    config.logWebSocketEvents,
    config.tailscaleIp,
  );

  if (preflight) {
    console.log("[agent-gui] Preflight checks passed.");
    return;
  }

  if (!skipBuild) {
    await runCommand(config.bunBin, ["run", "build"], config.t3RepoDir, {
      ...process.env,
      VITE_WS_URL: config.wsUrl,
    });
  }

  const serverEntry = `${config.t3RepoDir}/apps/server/dist/index.mjs`;
  const serverArgs = [
    serverEntry,
    "--host",
    config.host,
    "--port",
    String(config.port),
    "--no-browser",
    ...(config.autoBootstrapProjectFromCwd ? (["--auto-bootstrap-project-from-cwd"] as const) : []),
    ...(config.logWebSocketEvents ? (["--log-websocket-events"] as const) : []),
    ...(!config.disableAuth ? (["--auth-token", config.token] as const) : []),
  ];

  const serverEnv: NodeJS.ProcessEnv = { ...process.env };
  if (config.disableAuth) {
    delete serverEnv.T3CODE_AUTH_TOKEN;
  } else {
    serverEnv.T3CODE_AUTH_TOKEN = config.token;
  }

  const child = spawn("node", serverArgs, {
    cwd: config.projectRoot,
    stdio: "inherit",
    env: serverEnv,
  });

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
