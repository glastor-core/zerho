import { join, extname } from "@std/path";
import { exists } from "@std/fs";
import { buildSite } from "./src/core/builder.ts";

// If dist directory does not exist (e.g. fresh Deno Deploy checkout), build on the fly
if (!(await exists(join(Deno.cwd(), "dist")))) {
  console.log("⚡ [Deno Deploy] Generando compilación estática inicial...");
  await buildSite({ devMode: false });
}

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

Deno.serve(async (req) => {
  const url = new URL(req.url);

  let filePath = url.pathname;
  if (filePath === "/") {
    filePath = "/index.html";
  } else if (!extname(filePath)) {
    filePath = `${filePath}.html`;
  }

  const diskPath = join(Deno.cwd(), "dist", filePath);
  try {
    const file = await Deno.readFile(diskPath);
    const isAsset = filePath.startsWith("/assets/");
    const cacheControl = isAsset 
      ? "public, max-age=31536000, immutable" 
      : "public, max-age=3600, stale-while-revalidate=86400";

    return new Response(file, {
      headers: {
        "content-type": getContentType(diskPath),
        "cache-control": cacheControl,
        "x-powered-by": "ZerhoPress / Deno 2",
      },
    });
  } catch {
    // Try subfolder index.html
    try {
      const dirIndex = join(Deno.cwd(), "dist", url.pathname, "index.html");
      const file = await Deno.readFile(dirIndex);
      return new Response(file, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
          "x-powered-by": "ZerhoPress / Deno 2",
        },
      });
    } catch {
      return new Response("404: Página no encontrada en ZerhoPress", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  }
});
