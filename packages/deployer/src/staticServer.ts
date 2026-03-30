import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { readFile } from "node:fs/promises";

export type StaticServerOptions = {
  readonly host: string;
  readonly port: number;
  readonly rootDir: string;
};

export type StaticServerHandle = {
  readonly origin: string;
  readonly close: () => Promise<void>;
};

const handles = new Map<string, Promise<StaticServerHandle>>();

const contentTypeByExtension: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function getKey(options: StaticServerOptions): string {
  return `${options.host}:${options.port}:${resolve(options.rootDir)}`;
}

function contentTypeFor(pathname: string): string {
  const extension = extname(pathname).toLowerCase();
  return contentTypeByExtension[extension] ?? "application/octet-stream";
}

function getResolvedPath(rootDir: string, pathname: string): string | null {
  const normalizedPath = normalize(pathname).replace(/^[/\\]+/, "");
  const absoluteRoot = resolve(rootDir);
  const absolutePath = resolve(join(absoluteRoot, normalizedPath));
  if (!absolutePath.startsWith(absoluteRoot)) {
    return null;
  }
  return absolutePath;
}

function respondNotFound(response: ServerResponse): void {
  response.statusCode = 404;
  response.end("Not Found");
}

async function serveFile(
  request: IncomingMessage,
  response: ServerResponse,
  rootDir: string,
): Promise<void> {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.statusCode = 405;
    response.end("Method Not Allowed");
    return;
  }

  const parsedUrl = new URL(request.url ?? "/", "http://localhost");
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const resolvedPath = getResolvedPath(rootDir, pathname);
  if (!resolvedPath) {
    respondNotFound(response);
    return;
  }

  try {
    const file = await readFile(resolvedPath);
    response.statusCode = 200;
    response.setHeader("Content-Type", contentTypeFor(pathname));
    response.setHeader("Cache-Control", "no-store");
    if (method === "HEAD") {
      response.end();
      return;
    }
    response.end(file);
  } catch {
    respondNotFound(response);
  }
}

export function ensureStaticServer(options: StaticServerOptions): Promise<StaticServerHandle> {
  const key = getKey(options);
  const existing = handles.get(key);
  if (existing) {
    return existing;
  }

  const pending = new Promise<StaticServerHandle>((resolveHandle, rejectHandle) => {
    const server = createServer((request, response) => {
      void serveFile(request, response, options.rootDir);
    });

    server.on("error", (error) => {
      rejectHandle(error);
    });

    server.listen(options.port, options.host, () => {
      const origin = `http://${options.host}:${options.port}`;
      resolveHandle({
        origin,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            server.close((error) => {
              if (error) {
                rejectClose(error);
              } else {
                resolveClose();
              }
            });
          }),
      });
    });
  }).catch((error) => {
    handles.delete(key);
    throw error;
  });

  handles.set(key, pending);
  return pending;
}

export async function closeAllStaticServersForTests(): Promise<void> {
  const activeHandles = [...handles.values()];
  handles.clear();
  const resolved = await Promise.all(activeHandles);
  await Promise.all(resolved.map((handle) => handle.close()));
}
