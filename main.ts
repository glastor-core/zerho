import { extname, join, resolve, SEPARATOR } from "@std/path";
import { exists } from "@std/fs";
import { buildSite } from "./src/core/builder.ts";
import { SearchIndexer } from "./src/core/search.ts";

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
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https:; connect-src 'self' ws: wss: https:; frame-ancestors 'none';",
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

// In-memory search indexer for Ask AI
let cachedIndexer: SearchIndexer | null = null;
async function getSearchIndexer(): Promise<SearchIndexer> {
  if (cachedIndexer) return cachedIndexer;
  try {
    const data = await Deno.readTextFile(join(Deno.cwd(), "dist", "search-index.json"));
    cachedIndexer = SearchIndexer.fromJSON(data);
  } catch {
    cachedIndexer = new SearchIndexer();
  }
  return cachedIndexer;
}

function isValidDocPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= 200 &&
    path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

function getCacheControl(urlPath: string, diskPath: string): string {
  if (urlPath.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  const ext = extname(diskPath).toLowerCase();
  if (ext === ".xml" || ext === ".txt" || ext === ".ico" || ext === ".png" || ext === ".svg") {
    return "public, max-age=86400";
  }
  return "no-cache, must-revalidate";
}

export function resolveSafeDistPath(distRoot: string, rawSubPath: string): string | null {
  try {
    const decoded = decodeURIComponent(rawSubPath);
    if (decoded.includes("\0") || decoded.includes("..")) return null;
    const normalizedRel = decoded.replace(/^[/\\]+/, "");
    const resolvedRoot = resolve(distRoot);
    const resolvedTarget = resolve(resolvedRoot, normalizedRel);
    if (
      resolvedTarget !== resolvedRoot &&
      !resolvedTarget.startsWith(resolvedRoot + SEPARATOR)
    ) {
      return null;
    }
    return resolvedTarget;
  } catch {
    return null;
  }
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // 1. Deno KV Edge Feedback API
  if (url.pathname === "/api/feedback" && req.method === "POST") {
    try {
      const body = await req.json();
      const { path, helpful } = body;
      if (!isValidDocPath(path) || typeof helpful !== "boolean") {
        return Response.json(
          {
            success: false,
            error: "Valid path (starting with '/') and helpful boolean are required",
          },
          { status: 400 },
        );
      }
      if (kv) {
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
      const iter = kv.list({ prefix: ["feedback"] }, { limit: 200 });
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
      const queryIter = kv.list<Deno.KvU64>({ prefix: ["analytics", "query"] }, { limit: 200 });
      for await (const entry of queryIter) {
        const q = entry.key[2] as string;
        topQueries.push({ query: q, count: Number(entry.value.value) });
      }
      topQueries.sort((a, b) => b.count - a.count);

      // 3. Unanswered Queries (zero results)
      const zeroIter = kv.list<Deno.KvU64>(
        { prefix: ["analytics", "zero_results"] },
        { limit: 200 },
      );
      for await (const entry of zeroIter) {
        const q = entry.key[2] as string;
        unansweredQueries.push({ query: q, count: Number(entry.value.value) });
      }
      unansweredQueries.sort((a, b) => b.count - a.count);

      // 4. Feedback Summary
      const fbIter = kv.list({ prefix: ["feedback"] }, { limit: 200 });
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
      if (!query || typeof query !== "string" || !query.trim()) {
        return Response.json({ error: "Query is required" }, { status: 400 });
      }

      const indexer = await getSearchIndexer();
      const hits = indexer.search(query, 3);

      const topSources = hits.map((h) => ({
        title: `${h.item.title} ${h.item.section ? `› ${h.item.section}` : ""}`,
        url: h.item.url,
      }));

      // Synthesize intelligent response
      let answer = "";
      if (topSources.length === 0) {
        answer =
          `No encontré coincidencias exactas para "${query}" en la documentación actual. Te sugiero explorar la sección de **Guía de Inicio** o consultar el **Playground Interactivo**.`;
      } else {
        const topDoc = hits[0].item;
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

  // 6. Native Model Context Protocol (MCP) Server Endpoint for AI Agents (/api/mcp)
  if (url.pathname === "/api/mcp") {
    const mcpTools = [
      {
        name: "search_docs",
        description:
          "Busca semántica y textualmente en toda la documentación técnica del proyecto.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Consulta o término técnico a buscar" },
            limit: { type: "number", description: "Número máximo de resultados (por defecto 5)" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_llms_context",
        description:
          "Obtiene el índice estructurado /llms.txt completo de la documentación del proyecto.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];

    if (req.method === "GET") {
      return Response.json({
        protocol: "Model Context Protocol (MCP)",
        protocolVersion: "2024-11-05",
        serverInfo: { name: "zerho-docs-mcp", version: "1.7.0" },
        tools: mcpTools,
      });
    }

    if (req.method === "POST") {
      try {
        const rpc = await req.json();
        const id = rpc.id ?? null;
        const method = rpc.method;

        if (method === "initialize") {
          return Response.json({
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              serverInfo: { name: "zerho-docs-mcp", version: "1.7.0" },
              capabilities: { tools: {} },
            },
          });
        }

        if (method === "tools/list") {
          return Response.json({
            jsonrpc: "2.0",
            id,
            result: { tools: mcpTools },
          });
        }

        if (method === "tools/call") {
          const toolName = rpc.params?.name;
          const toolArgs = rpc.params?.arguments || {};

          if (toolName === "search_docs") {
            const q = String(toolArgs.query || "");
            const limit = Number(toolArgs.limit) || 5;
            const indexer = await getSearchIndexer();
            const results = indexer.search(q, limit).map((r) => ({
              title: r.item.title,
              section: r.item.section,
              url: r.item.url,
              excerpt: r.item.content,
              score: r.score,
            }));
            return Response.json({
              jsonrpc: "2.0",
              id,
              result: {
                content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
              },
            });
          }

          if (toolName === "get_llms_context") {
            let llmsContent = "# Documentación Zerho";
            try {
              llmsContent = await Deno.readTextFile(join(Deno.cwd(), "dist", "llms.txt"));
            } catch {
              // Fallback if dist/llms.txt not yet built
            }
            return Response.json({
              jsonrpc: "2.0",
              id,
              result: {
                content: [{ type: "text", text: llmsContent }],
              },
            });
          }

          return Response.json(
            {
              jsonrpc: "2.0",
              id,
              error: { code: -32601, message: `Herramienta MCP desconocida: ${toolName}` },
            },
            { status: 400 },
          );
        }

        return Response.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Método JSON-RPC no soportado: ${method}` },
          },
          { status: 400 },
        );
      } catch {
        return Response.json(
          { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
          { status: 400 },
        );
      }
    }
  }

  // 7. Static file router with Path Traversal protection & Edge Caching
  const distRoot = join(Deno.cwd(), "dist");
  let filePath = url.pathname;
  if (filePath.endsWith("/")) {
    filePath = `${filePath}index.html`;
  } else if (!extname(filePath)) {
    filePath = `${filePath}.html`;
  }

  const diskPath = resolveSafeDistPath(distRoot, filePath);
  if (!diskPath) {
    return new Response("403: Acceso denegado", {
      status: 403,
      headers: {
        ...SECURITY_HEADERS,
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  try {
    const file = await Deno.readFile(diskPath);
    const cacheControl = getCacheControl(url.pathname, diskPath);

    return new Response(file, {
      headers: {
        ...SECURITY_HEADERS,
        "content-type": getContentType(diskPath),
        "cache-control": cacheControl,
      },
    });
  } catch {
    // Try subfolder index.html
    const dirIndex = resolveSafeDistPath(distRoot, `${url.pathname}/index.html`);
    if (dirIndex) {
      try {
        const file = await Deno.readFile(dirIndex);
        return new Response(file, {
          headers: {
            ...SECURITY_HEADERS,
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-cache, must-revalidate",
          },
        });
      } catch {
        // Fall through to 404
      }
    }
    return new Response("404: Página no encontrada en Zerho", {
      status: 404,
      headers: {
        ...SECURITY_HEADERS,
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }
}

if (import.meta.main) {
  const portEnv = Deno.env.get("PORT");
  const port = portEnv ? Number(portEnv) : 8000;
  Deno.serve({ port: Number.isFinite(port) && port > 0 ? port : 8000 }, handleRequest);
}
