import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

export type AgentGuiConfig = {
  readonly bunBin: string;
  readonly t3RepoDir: string;
  readonly port: number;
  readonly host: string;
  readonly token: string;
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
  if (ip.length === 0) {
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

  const tailscaleIp = detectTailscaleIpv4();
  const bunBin = env.BUN_BIN?.trim() || "bun";
  const host = env.T3CODE_HOST?.trim() || tailscaleIp || "127.0.0.1";
  const port = parsePort(env.T3CODE_PORT);
  const token = env.T3CODE_AUTH_TOKEN?.trim() || randomBytes(24).toString("hex");

  return {
    bunBin,
    t3RepoDir,
    host,
    port,
    token,
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
