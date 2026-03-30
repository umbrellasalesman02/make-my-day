import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { createLocalFsDeployer } from "../src/localFsDeployer.ts";
import { closeAllStaticServersForTests } from "../src/staticServer.ts";

test("deployer smoke: deploy file and resolve preview URL", async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), "deployer-smoke-"));
  const deployer = createLocalFsDeployer({
    host: "127.0.0.1",
    port: 4510,
    runtimeRoot,
  });

  const marker = `mvp-smoke-${Date.now()}`;
  const result = await deployer.deploy({
    slug: "smoke-page",
    path: "index.html",
    content: `<html><body><h1>${marker}</h1></body></html>`,
  });

  const response = await fetch(result.previewUrl);
  const body = await response.text();

  expect(response.status).toBe(200);
  expect(body).toContain(marker);

  await closeAllStaticServersForTests();
  await rm(runtimeRoot, { recursive: true, force: true });
});
