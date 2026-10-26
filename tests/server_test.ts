import { assertEquals, assertStringIncludes } from "@std/assert";
import { handleRequest } from "../main.ts";

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
