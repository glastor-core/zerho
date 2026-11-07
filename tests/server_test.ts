import { assertEquals, assertStringIncludes } from "@std/assert";
import { handleRequest, resolveSafeDistPath } from "../main.ts";

Deno.test("Server: resolveSafeDistPath prevents directory traversal", () => {
  const safe = resolveSafeDistPath("/var/www/dist", "/guide/getting-started.html");
  assertEquals(safe !== null, true);

  const traversal1 = resolveSafeDistPath("/var/www/dist", "/../../etc/passwd");
  assertEquals(traversal1, null);

  const traversal2 = resolveSafeDistPath("/var/www/dist", "/%2e%2e/%2e%2e/deno.json");
  assertEquals(traversal2, null);
});

Deno.test("Server: GET path traversal attempt returns 403 Forbidden", async () => {
  const req = new Request("http://localhost:8000/..%5c..%5cdeno.json", {
    method: "GET",
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 403);
});

Deno.test("Server: POST /api/feedback registers helpful vote", async () => {
  const req = new Request("http://localhost:8000/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "/guide/test-page",
      helpful: true,
    }),
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
});

Deno.test("Server: POST /api/feedback rejects invalid payload", async () => {
  const req = new Request("http://localhost:8000/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 400);
});

Deno.test("Server: GET /api/feedback/stats returns metrics object", async () => {
  const req = new Request("http://localhost:8000/api/feedback/stats", {
    method: "GET",
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertEquals(typeof data.stats, "object");
});

Deno.test("Server: POST /api/ai/ask rejects empty query", async () => {
  const req = new Request("http://localhost:8000/api/ai/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "" }),
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 400);
});

Deno.test("Server: POST /api/ai/ask synthesizes response with sources", async () => {
  const req = new Request("http://localhost:8000/api/ai/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "despliegue en deno deploy" }),
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(typeof data.answer, "string");
  assertEquals(Array.isArray(data.sources), true);
  assertEquals(data.engine, "Zerho Edge AI RAG");
});

Deno.test("Server: Return 404 for non-existent page", async () => {
  const req = new Request("http://localhost:8000/non-existent-file-xyz", {
    method: "GET",
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 404);
  const text = await res.text();
  assertStringIncludes(text, "404");
});

Deno.test("Server: Serves subfolder index routes (/playground/ and /playground)", async () => {
  const resWithSlash = await handleRequest(new Request("http://localhost:8000/playground/"));
  assertEquals(resWithSlash.status, 200);
  const html1 = await resWithSlash.text();
  assertStringIncludes(html1, "Playground");

  const resWithoutSlash = await handleRequest(new Request("http://localhost:8000/playground"));
  assertEquals(resWithoutSlash.status, 200);
  const html2 = await resWithoutSlash.text();
  assertStringIncludes(html2, "Playground");
});

Deno.test("Server: POST /api/analytics/search ingests query telemetry", async () => {
  const req = new Request("http://localhost:8000/api/analytics/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "deno deploy", count: 5 }),
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
});

Deno.test("Server: GET /api/insights returns search and feedback analytics", async () => {
  const req = new Request("http://localhost:8000/api/insights", {
    method: "GET",
  });

  const res = await handleRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.success, true);
  assertEquals(typeof data.insights.totalSearches, "number");
  assertEquals(Array.isArray(data.insights.topQueries), true);
  assertEquals(Array.isArray(data.insights.unansweredQueries), true);
});

Deno.test("Server: /api/mcp handles Model Context Protocol JSON-RPC initialize, tools/list and tools/call", async () => {
  // 1. GET discovery
  const getRes = await handleRequest(new Request("http://localhost:8000/api/mcp"));
  assertEquals(getRes.status, 200);
  const discovery = await getRes.json();
  assertEquals(discovery.protocolVersion, "2024-11-05");

  // 2. POST initialize
  const initRes = await handleRequest(
    new Request("http://localhost:8000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    }),
  );
  assertEquals(initRes.status, 200);
  const initData = await initRes.json();
  assertEquals(initData.result.serverInfo.name, "zerho-docs-mcp");

  // 3. POST tools/call (search_docs)
  const callRes = await handleRequest(
    new Request("http://localhost:8000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "search_docs", arguments: { query: "Deno", limit: 2 } },
      }),
    }),
  );
  assertEquals(callRes.status, 200);
  const callData = await callRes.json();
  assertEquals(Array.isArray(callData.result.content), true);
});
