import { extname, join } from "@std/path";
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

const SECURITY_HEADERS: Record<string, string> = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss: https:; frame-ancestors 'none';",
  "x-powered-by": "Zerho / Deno 2",
};

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
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
  };
  return types[ext] || "application/octet-stream";
}

// In-memory search index for Ask AI
let cachedSearchIndex:
  | Array<{ id: string; url: string; title: string; section?: string; content: string }>
  | null = null;
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

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // 1. Deno KV Edge Feedback API
  if (url.pathname === "/api/feedback" && req.method === "POST") {
    try {
      const body = await req.json();
      const { path, helpful } = body;
      if (!path || typeof helpful !== "boolean") {
        return Response.json({ success: false, error: "path and helpful are required" }, {
          status: 400,
        });
      }
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

  // 3. Search Analytics Telemetry
  if (url.pathname === "/api/analytics/search" && req.method === "POST") {
    try {
      const { query, count } = await req.json();
      if (!query || typeof query !== "string") {
        return Response.json({ success: false, error: "query is required" }, { status: 400 });
      }

      const cleanQuery = query.trim().toLowerCase().slice(0, 100);
      if (kv && cleanQuery) {
        await kv.atomic()
          .sum(["analytics", "searches_total"], 1n)
          .sum(["analytics", "query", cleanQuery], 1n)
          .commit();

        if (Number(count) === 0) {
          await kv.atomic()
            .sum(["analytics", "zero_results", cleanQuery], 1n)
            .commit();
        }
      }

      return Response.json({ success: true, message: "Búsqueda registrada en Deno KV" });
    } catch {
      return Response.json({ success: false }, { status: 400 });
    }
  }

  // 4. Documentation Insights & KV Analytics
  if (url.pathname === "/api/insights" && req.method === "GET") {
    let totalSearches = 0;
    const topQueries: Array<{ query: string; count: number }> = [];
    const unansweredQueries: Array<{ query: string; count: number }> = [];
    const feedbackSummary: Record<string, { positive: number; negative: number }> = {};

    if (kv) {
      // 1. Total Searches
      const totalEntry = await kv.get<Deno.KvU64>(["analytics", "searches_total"]);
      if (totalEntry?.value) {
        totalSearches = Number(totalEntry.value.value);
      }

      // 2. Top Queries
      const queryIter = kv.list<Deno.KvU64>({ prefix: ["analytics", "query"] });
      for await (const entry of queryIter) {
        const q = entry.key[2] as string;
        topQueries.push({ query: q, count: Number(entry.value.value) });
      }
      topQueries.sort((a, b) => b.count - a.count);

      // 3. Unanswered Queries (zero results)
      const zeroIter = kv.list<Deno.KvU64>({ prefix: ["analytics", "zero_results"] });
      for await (const entry of zeroIter) {
        const q = entry.key[2] as string;
        unansweredQueries.push({ query: q, count: Number(entry.value.value) });
      }
      unansweredQueries.sort((a, b) => b.count - a.count);

      // 4. Feedback Summary
      const fbIter = kv.list({ prefix: ["feedback"] });
      for await (const entry of fbIter) {
        const path = entry.key[1] as string;
        const type = entry.key[2] as "positive" | "negative";
        feedbackSummary[path] = feedbackSummary[path] || { positive: 0, negative: 0 };
        feedbackSummary[path][type] = Number(entry.value);
      }
    }

    return Response.json({
      success: true,
      insights: {
        totalSearches,
        topQueries: topQueries.slice(0, 10),
        unansweredQueries: unansweredQueries.slice(0, 10),
        feedbackSummary,
      },
    });
  }

  // 5. Ask AI Edge Semantic Search & RAG
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
        answer =
          `No encontré coincidencias exactas para "${query}" en la documentación actual. Te sugiero explorar la sección de **Guía de Inicio** o consultar el **Playground Interactivo**.`;
      } else {
        const topDoc = scored[0].doc;
        answer = `En base a la documentación de **Zerho**:\n\n` +
          `Para resolver tu consulta sobre **"${query}"**, la sección más relevante es [${
            topSources[0].title
          }](${topSources[0].url}).\n\n` +
          `> ${topDoc.content.slice(0, 240)}...\n\n` +
          `Puedes utilizar los bloques interactivos con \`\`\`ts run para probar el código en vivo en el navegador o revisar la configuración en \`zerho.config.ts\`.`;
      }

      return Response.json({
        answer,
        sources: topSources,
        engine: "Zerho Edge AI RAG",
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
    const cacheControl = isAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache, must-revalidate";

    return new Response(file, {
      headers: {
        ...SECURITY_HEADERS,
        "content-type": getContentType(diskPath),
        "cache-control": cacheControl,
      },
    });
  } catch {
    // Try subfolder index.html
    try {
      const dirIndex = join(Deno.cwd(), "dist", url.pathname, "index.html");
      const file = await Deno.readFile(dirIndex);
      return new Response(file, {
        headers: {
          ...SECURITY_HEADERS,
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    } catch {
      return new Response("404: Página no encontrada en Zerho", {
        status: 404,
        headers: {
          ...SECURITY_HEADERS,
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}
