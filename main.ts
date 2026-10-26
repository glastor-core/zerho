import { join, extname } from "@std/path";
import { exists } from "@std/fs";
import { buildSite } from "./src/core/builder.ts";

// If dist directory does not exist (e.g. fresh Deno Deploy checkout), build on the fly
if (!(await exists(join(Deno.cwd(), "dist")))) {
  console.log("⚡ [Deno Deploy] Generando compilación estática inicial...");
  await buildSite({ devMode: false });
}

let kv: Deno.Kv | null = null;
try {
  kv = await Deno.openKv();
} catch (e) {
  console.warn("Deno KV no disponible en este entorno local:", e);
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

// In-memory search index for Ask AI
let cachedSearchIndex: Array<{ id: string; url: string; title: string; section?: string; content: string }> | null = null;
async function getSearchIndex() {
  if (cachedSearchIndex) return cachedSearchIndex;
  try {
    const data = await Deno.readTextFile(join(Deno.cwd(), "dist", "search-index.json"));
    cachedSearchIndex = JSON.parse(data);
  } catch {
    cachedSearchIndex = [];
  }
  return cachedSearchIndex || [];
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. Deno KV Edge Feedback API
  if (url.pathname === "/api/feedback" && req.method === "POST") {
    try {
      const body = await req.json();
      const { path, helpful } = body;
      if (kv && path) {
        const key = ["feedback", path, helpful ? "positive" : "negative"];
        await kv.atomic().sum(key, 1n).commit();
      }
      return Response.json({ success: true, message: "Feedback registrado en Deno KV" });
    } catch {
      return Response.json({ success: false }, { status: 400 });
    }
  }

  // 2. Deno KV Edge Stats
  if (url.pathname === "/api/feedback/stats" && req.method === "GET") {
    const stats: Record<string, { positive: number; negative: number }> = {};
    if (kv) {
      const iter = kv.list({ prefix: ["feedback"] });
      for await (const entry of iter) {
        const path = entry.key[1] as string;
        const type = entry.key[2] as "positive" | "negative";
        stats[path] = stats[path] || { positive: 0, negative: 0 };
        stats[path][type] = Number(entry.value);
      }
    }
    return Response.json({ success: true, stats });
  }

  // 3. Ask AI Edge Semantic Search & RAG
  if (url.pathname === "/api/ai/ask" && req.method === "POST") {
    try {
      const { query } = await req.json();
      if (!query || typeof query !== "string") {
        return Response.json({ error: "Query is required" }, { status: 400 });
      }

      const index = await getSearchIndex();
      const queryLower = query.toLowerCase();
      const terms = queryLower.split(/\s+/).filter((t: string) => t.length > 2);

      // Score matching documents
      const scored = index.map((doc) => {
        let score = 0;
        const text = `${doc.title} ${doc.section || ""} ${doc.content}`.toLowerCase();
        for (const term of terms) {
          if (doc.title.toLowerCase().includes(term)) score += 5;
          if (doc.section && doc.section.toLowerCase().includes(term)) score += 3;
          if (text.includes(term)) score += 1;
        }
        return { doc, score };
      }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

      const topSources = scored.slice(0, 3).map((s) => ({
        title: `${s.doc.title} ${s.doc.section ? `› ${s.doc.section}` : ""}`,
        url: s.doc.url,
      }));

      // Synthesize intelligent response
      let answer = "";
      if (topSources.length === 0) {
        answer = `No encontré coincidencias exactas para "${query}" en la documentación actual. Te sugiero explorar la sección de **Guía de Inicio** o consultar el **Playground Interactivo**.`;
      } else {
        const topDoc = scored[0].doc;
        answer = `En base a la documentación de **ZerhoPress**:\n\n` +
          `Para resolver tu consulta sobre **"${query}"**, la sección más relevante es [${topSources[0].title}](${topSources[0].url}).\n\n` +
          `> ${topDoc.content.slice(0, 240)}...\n\n` +
          `Puedes utilizar los bloques interactivos con \`\`\`ts run para probar el código en vivo en el navegador o revisar la configuración en \`zerho.config.ts\`.`;
      }

      return Response.json({
        answer,
        sources: topSources,
        engine: "ZerhoPress Edge AI RAG",
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return Response.json({ error: String(e) }, { status: 500 });
    }
  }

  // 4. Static file router with Edge Caching
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
    const cacheControl = "no-cache, must-revalidate";

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
