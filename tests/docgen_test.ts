import { assertEquals, assertStringIncludes } from "@std/assert";
import { extractDenoDoc, formatSymbolsToMarkdown } from "../src/core/docgen.ts";

Deno.test("Docgen: Extract symbols from TypeScript source module", async () => {
  const symbols = await extractDenoDoc("src/core/search.ts");
  assertEquals(Array.isArray(symbols), true);
  assertEquals(symbols.length >= 2, true);

  const names = symbols.map((s) => s.name);
  assertEquals(names.includes("SearchIndexer"), true);
  assertEquals(names.includes("SearchDocument"), true);
});

Deno.test("Docgen: Format extracted symbols to structured Markdown", async () => {
  const symbols = await extractDenoDoc("src/core/search.ts");
  const markdown = formatSymbolsToMarkdown(symbols, "Search API Reference");

  assertStringIncludes(markdown, "# Search API Reference");
  assertStringIncludes(markdown, "SearchIndexer");
  assertStringIncludes(markdown, "SearchDocument");
  assertStringIncludes(markdown, "addDocument");
  assertStringIncludes(markdown, "| Propiedad |");
  assertStringIncludes(markdown, "| Parámetro |");
});
