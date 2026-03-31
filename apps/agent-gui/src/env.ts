import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

export type AgentGuiConfig = {
  readonly bunBin: string;
  readonly t3RepoDir: string;
  readonly projectRoot: string;
  readonly port: number;
  readonly host: string;
  readonly token: string;
  readonly disableAuth: boolean;
  readonly wsUrl: string;
  readonly logWebSocketEvents: boolean;
  readonly autoBootstrapProjectFromCwd: boolean;
  readonly tailscaleIp: string | null;
};

function parsePort(rawPort: string | undefined): number {
  const fallback = 3773;
  if (!rawPort || rawPort.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid T3CODE_PORT: ${rawPort}`);
  }
  return parsed;
}

function parseBoolean(rawValue: string | undefined, fallback: boolean): boolean {
  if (!rawValue || rawValue.trim().length === 0) {
    return fallback;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") {
    return false;
  }
  return fallback;
}

export function ensureBunIsInstalled(bunBin: string): void {
  const result = spawnSync(bunBin, ["--version"], { stdio: "ignore" });
  if (result.status !== 0) {
    throw new Error(
      `Bun is required for T3 remote startup. Unable to execute "${bunBin} --version". If Bun is a local dependency, ensure install scripts were approved (try \`vp pm approve-builds\`).`,
    );
  }
}

export function detectTailscaleIpv4(): string | null {
  const result = spawnSync("tailscale", ["ip", "-4"], { encoding: "utf8" });
  if (result.status !== 0) {
    return null;
  }

  const ip = result.stdout.trim();
  const ipv4Pattern =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  if (!ipv4Pattern.test(ip)) {
    return null;
  }
  return ip;
}

export async function resolveConfig(env: NodeJS.ProcessEnv): Promise<AgentGuiConfig> {
  const t3RepoDir = env.T3CODE_REPO_DIR;
  if (!t3RepoDir || t3RepoDir.trim().length === 0) {
    throw new Error("T3CODE_REPO_DIR is required and must point to a local t3code clone.");
  }

  await access(t3RepoDir, constants.R_OK);

  const projectRoot = env.T3CODE_PROJECT_ROOT?.trim() || "/Users/erikwiberg/dev/codex";
  await access(projectRoot, constants.R_OK);

  const tailscaleIp = detectTailscaleIpv4();
  const bunBin = env.BUN_BIN?.trim() || "bun";
  const host = env.T3CODE_HOST?.trim() || tailscaleIp || "127.0.0.1";
  const port = parsePort(env.T3CODE_PORT);
  const token = env.T3CODE_AUTH_TOKEN?.trim() || randomBytes(24).toString("hex");
  const disableAuth = parseBoolean(env.T3CODE_DISABLE_AUTH, false);
  const wsUrl = disableAuth
    ? `ws://${host}:${port}`
    : `ws://${host}:${port}/?token=${encodeURIComponent(token)}`;
  const logWebSocketEvents = parseBoolean(env.T3CODE_LOG_WS_EVENTS, true);
  const autoBootstrapProjectFromCwd = parseBoolean(
    env.T3CODE_AUTO_BOOTSTRAP_PROJECT_FROM_CWD,
    true,
  );

  return {
    bunBin,
    t3RepoDir,
    projectRoot,
    host,
    port,
    token,
    disableAuth,
    wsUrl,
    logWebSocketEvents,
    autoBootstrapProjectFromCwd,
    tailscaleIp,
  };
}

export function getAccessUrls(host: string, port: number, tailscaleIp: string | null) {
  return {
    local: `http://127.0.0.1:${port}`,
    host: `http://${host}:${port}`,
    tailnet: tailscaleIp ? `http://${tailscaleIp}:${port}` : null,
  };
}
