import { extname, join, resolve, SEPARATOR } from "@std/path";
import { buildSite } from "./builder.ts";
import { handleRequest } from "../../main.ts";

const portEnv = Deno.env.get("PORT");
const PORT = portEnv && Number.isFinite(Number(portEnv)) && Number(portEnv) > 0
  ? Number(portEnv)
  : 3000;
const clients = new Set<WebSocket>();

// Initial build with devMode enabled
await buildSite({ devMode: true });

// Watcher loop for live reload
(async () => {
  const watcher = Deno.watchFs([
    join(Deno.cwd(), "docs"),
    join(Deno.cwd(), "src"),
    join(Deno.cwd(), "zerho.config.ts"),
  ]);
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

  for await (const _event of watcher) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      console.log("\n🔄 Cambio detectado, recompilando...");
      try {
        await buildSite({ devMode: true });
        for (const ws of clients) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("reload");
          }
        }
      } catch (err) {
        console.error("Error en recompilación:", err);
      }
    }, 150);
  }
})();

// MIME type resolver
function getContentType(path: string): string {
  const ext = extname(path).toLowerCase();
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
  };
  return types[ext] || "application/octet-stream";
}

// Dev server
Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);

  // WebSocket HMR endpoint
  if (url.pathname === "/_hmr") {
    if (req.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(req);
      socket.onopen = () => clients.add(socket);
      socket.onclose = () => clients.delete(socket);
      socket.onerror = () => clients.delete(socket);
      return response;
    }
    return new Response("Expected WebSocket", { status: 400 });
  }

  // Delegate Edge API endpoints (/api/ai/ask, /api/feedback, /api/insights, etc.)
  if (
    url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/openapi") &&
    !url.pathname.startsWith("/api/runtime")
  ) {
    return await handleRequest(req);
  }

  const distRoot = resolve(Deno.cwd(), "dist");
  let rawPath = "";
  try {
    rawPath = decodeURIComponent(url.pathname);
  } catch {
    return new Response("400: Bad Request", { status: 400 });
  }

  let filePath = rawPath;
  if (filePath.endsWith("/")) {
    filePath = `${filePath}index.html`;
  } else if (!extname(filePath)) {
    filePath = `${filePath}.html`;
  }

  const diskPath = resolve(distRoot, filePath.replace(/^[/\\]+/, ""));
  if (diskPath !== distRoot && !diskPath.startsWith(distRoot + SEPARATOR)) {
    return new Response("403: Forbidden", { status: 403 });
  }

  try {
    const file = await Deno.readFile(diskPath);
    return new Response(file, {
      headers: {
        "content-type": getContentType(diskPath),
        "cache-control": "no-cache",
      },
    });
  } catch {
    // Try index.html inside directory if present (e.g. /playground -> dist/playground/index.html)
    try {
      const cleanDir = rawPath.replace(/^[/\\]+|[/\\]+$/g, "");
      const dirIndex = resolve(distRoot, cleanDir, "index.html");
      if (dirIndex.startsWith(distRoot + SEPARATOR)) {
        const file = await Deno.readFile(dirIndex);
        return new Response(file, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-cache",
          },
        });
      }
    } catch {
      // Fall through to 404
    }
    return new Response(`404: Not Found (${url.pathname})`, { status: 404 });
  }
});

console.log(`\n🚀 \x1b[36m[Zerho Dev Server]\x1b[0m Listo en http://localhost:${PORT}/\n`);
