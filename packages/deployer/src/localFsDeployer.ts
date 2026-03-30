import { randomUUID } from "node:crypto";
import { dirname, join, posix, resolve } from "node:path";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import type { Deployer, DeployInput, DeployResult } from "./contracts.js";
import { ensureStaticServer } from "./staticServer.js";

export type LocalFsDeployerOptions = {
  readonly host?: string;
  readonly port?: number;
  readonly runtimeRoot?: string;
  readonly baseUrl?: string;
};

const slugPattern = /^[a-z0-9-]{1,64}$/;

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function assertValidSlug(slug: string): void {
  if (!slugPattern.test(slug)) {
    throw new Error(`Invalid slug "${slug}". Use lowercase letters, digits, and hyphens only.`);
  }
}

function assertValidRelativePath(path: string): void {
  if (path.length === 0 || path.startsWith("/") || path.includes("\0")) {
    throw new Error(`Invalid deploy path "${path}".`);
  }

  const normalized = posix.normalize(path);
  if (normalized.startsWith("../") || normalized === "..") {
    throw new Error(`Invalid deploy path "${path}" (path traversal is not allowed).`);
  }
}

export function createLocalFsDeployer(options: LocalFsDeployerOptions = {}): Deployer {
  const host = options.host ?? process.env.DEPLOYER_HOST ?? "127.0.0.1";
  const port = options.port ?? Number.parseInt(process.env.DEPLOYER_PORT ?? "4310", 10);
  const runtimeRoot = resolve(options.runtimeRoot ?? join(process.cwd(), ".runtime"));
  const baseUrl = options.baseUrl ?? process.env.PREVIEW_BASE_URL ?? `http://${host}:${port}`;

  return {
    async deploy(input: DeployInput): Promise<DeployResult> {
      assertValidSlug(input.slug);
      assertValidRelativePath(input.path);

      const previewsRoot = join(runtimeRoot, "previews");
      const tmpRoot = join(runtimeRoot, ".tmp");
      const finalDir = join(previewsRoot, input.slug);
      const tempDir = join(tmpRoot, `${input.slug}-${Date.now()}-${randomUUID()}`);
      const tempFile = join(tempDir, input.path);
      const finalFile = join(finalDir, input.path);

      await mkdir(dirname(tempFile), { recursive: true });
      await writeFile(tempFile, input.content, "utf8");

      await mkdir(previewsRoot, { recursive: true });
      await rm(finalDir, { recursive: true, force: true });
      await rename(tempDir, finalDir);

      await ensureStaticServer({
        host,
        port,
        rootDir: runtimeRoot,
      });

      return {
        slug: input.slug,
        previewUrl: `${baseUrl}/previews/${encodeURIComponent(input.slug)}/${encodePath(input.path)}`,
        localPath: finalFile,
      };
    },
  };
}
