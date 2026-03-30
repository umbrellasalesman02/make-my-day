import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vite-plus/test";
import { createLocalFsDeployer } from "../src/localFsDeployer.ts";
import { closeAllStaticServersForTests } from "../src/staticServer.ts";

let portSeed = 4420;

function nextPort(): number {
  portSeed += 1;
  return portSeed;
}

test("valid deploy writes file and returns preview URL", async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), "deployer-test-"));
  const deployer = createLocalFsDeployer({
    host: "127.0.0.1",
    port: nextPort(),
    runtimeRoot,
  });

  const result = await deployer.deploy({
    slug: "hello-world",
    path: "index.html",
    content: "<h1>Hello</h1>",
  });

  expect(result.previewUrl).toContain("/previews/hello-world/index.html");
  expect(await readFile(result.localPath, "utf8")).toBe("<h1>Hello</h1>");

  await closeAllStaticServersForTests();
  await rm(runtimeRoot, { recursive: true, force: true });
});

test("invalid slug is rejected", async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), "deployer-test-"));
  const deployer = createLocalFsDeployer({
    host: "127.0.0.1",
    port: nextPort(),
    runtimeRoot,
  });

  await expect(
    deployer.deploy({
      slug: "INVALID",
      path: "index.html",
      content: "<h1>Hello</h1>",
    }),
  ).rejects.toThrow("Invalid slug");

  await closeAllStaticServersForTests();
  await rm(runtimeRoot, { recursive: true, force: true });
});

test("path traversal is rejected", async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), "deployer-test-"));
  const deployer = createLocalFsDeployer({
    host: "127.0.0.1",
    port: nextPort(),
    runtimeRoot,
  });

  await expect(
    deployer.deploy({
      slug: "safe-slug",
      path: "../index.html",
      content: "<h1>Hello</h1>",
    }),
  ).rejects.toThrow("path traversal");

  await closeAllStaticServersForTests();
  await rm(runtimeRoot, { recursive: true, force: true });
});

test("redeploy with same slug overwrites existing content", async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), "deployer-test-"));
  const deployer = createLocalFsDeployer({
    host: "127.0.0.1",
    port: nextPort(),
    runtimeRoot,
  });

  const first = await deployer.deploy({
    slug: "stable-page",
    path: "index.html",
    content: "<h1>v1</h1>",
  });
  expect(await readFile(first.localPath, "utf8")).toBe("<h1>v1</h1>");

  const second = await deployer.deploy({
    slug: "stable-page",
    path: "index.html",
    content: "<h1>v2</h1>",
  });
  expect(await readFile(second.localPath, "utf8")).toBe("<h1>v2</h1>");
  expect(second.previewUrl).toBe(first.previewUrl);

  await closeAllStaticServersForTests();
  await rm(runtimeRoot, { recursive: true, force: true });
});

test("preview URL is reachable when server is running", async () => {
  const runtimeRoot = await mkdtemp(join(tmpdir(), "deployer-test-"));
  const deployer = createLocalFsDeployer({
    host: "127.0.0.1",
    port: nextPort(),
    runtimeRoot,
  });

  const result = await deployer.deploy({
    slug: "reachable",
    path: "index.html",
    content: "<h1>Reachable</h1>",
  });

  const response = await fetch(result.previewUrl);
  const body = await response.text();
  expect(response.status).toBe(200);
  expect(body).toContain("Reachable");

  await closeAllStaticServersForTests();
  await rm(runtimeRoot, { recursive: true, force: true });
});
