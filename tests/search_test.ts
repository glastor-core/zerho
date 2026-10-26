import { assertEquals, assertGreater } from "@std/assert";
import { SearchIndexer } from "../src/core/search.ts";

Deno.test("SearchIndexer: Add documents and query results", () => {
  const indexer = new SearchIndexer();

  indexer.addDocument({
    id: "/guide/getting-started",
    url: "/guide/getting-started",
    title: "Primeros Pasos con ZerhoPress",
    section: "Instalación",
    content: "Para comenzar a usar ZerhoPress en Deno 2 necesitas configurar deno.json",
  });

  indexer.addDocument({
    id: "/guide/deployment",
    url: "/guide/deployment",
    title: "Despliegue en Deno Deploy",
    section: "Edge Hosting",
    content: "Despliega tu documentación en más de 35 regiones mundiales con latencia cero",
  });

  const results = indexer.search("deno deploy");
  assertEquals(results.length, 2);
  assertEquals(results[0].item.id, "/guide/deployment");
  assertGreater(results[0].score, results[1].score);
});

Deno.test("SearchIndexer: Exact match scores higher than partial match", () => {
  const indexer = new SearchIndexer();

  indexer.addDocument({
    id: "partial",
    url: "/partial",
    title: "Configuración Básica",
    content: "Contenido que menciona la palabra server de forma casual",
  });

  indexer.addDocument({
    id: "exact",
    url: "/exact",
    title: "Server HTTP Nativo",
    content: "Guía completa del server HTTP de Deno",
  });

  const results = indexer.search("Server HTTP");
  assertEquals(results[0].item.id, "exact");
});

Deno.test("SearchIndexer: Empty query returns empty array", () => {
  const indexer = new SearchIndexer();
  indexer.addDocument({
    id: "1",
    url: "/1",
    title: "Doc",
    content: "Test",
  });

  assertEquals(indexer.search("").length, 0);
  assertEquals(indexer.search("   ").length, 0);
});

Deno.test("SearchIndexer: JSON serialization and deserialization", () => {
  const indexer = new SearchIndexer();
  indexer.addDocument({
    id: "/test",
    url: "/test",
    title: "Serialization Test",
    section: "Core",
    content: "Probando exportación a JSON para cliente estático",
  });

  const jsonStr = indexer.toJSON();
  const parsed = JSON.parse(jsonStr);
  assertEquals(Array.isArray(parsed), true);
  assertEquals(parsed.length, 1);
  assertEquals(parsed[0].title, "Serialization Test");

  const restored = SearchIndexer.fromJSON(jsonStr);
  const searchHits = restored.search("exportación");
  assertEquals(searchHits.length, 1);
  assertEquals(searchHits[0].item.id, "/test");
});
