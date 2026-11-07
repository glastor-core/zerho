import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  extractDenoDoc,
  formatSymbolsToMarkdown,
  generateApiDocs,
  validateSymbolsDocumentation,
} from "../src/core/docgen.ts";
import {
  extractMarkdownCodeBlocks,
  runDocsTests,
  validateCodeBlock,
} from "../scripts/test-docs.ts";

Deno.test("Docgen: Extract symbols from TypeScript source module", async () => {
  const symbols = await extractDenoDoc("src/core/search.ts");
  assertEquals(Array.isArray(symbols), true);
  assertEquals(symbols.length >= 2, true);

  const names = symbols.map((s) => s.name);
  assertEquals(names.includes("SearchIndexer"), true);
  assertEquals(names.includes("SearchDocument"), true);
});

Deno.test("Docgen: Format extracted symbols to structured Markdown with repoUrl, @deprecated and @example", async () => {
  const symbols = await extractDenoDoc("src/core/search.ts");
  const markdown = formatSymbolsToMarkdown(
    symbols,
    "Search API Reference",
    "https://github.com/glastor-core/zerho/blob/main",
  );

  assertStringIncludes(markdown, "# Search API Reference");
  assertStringIncludes(markdown, "SearchIndexer");
  assertStringIncludes(markdown, "SearchDocument");
  assertStringIncludes(markdown, "addDocument");
  assertStringIncludes(
    markdown,
    "https://github.com/glastor-core/zerho/blob/main/src/core/search.ts#L",
  );
  assertStringIncludes(markdown, "| Propiedad |");
  assertStringIncludes(markdown, "| Parámetro |");

  // Synthetic symbol with @deprecated and @example tags
  const taggedMd = formatSymbolsToMarkdown([
    {
      name: "legacyConnect",
      declarations: [
        {
          kind: "function",
          declarationKind: "export",
          location: { filename: "file:///project/src/net.ts", line: 42, col: 0 },
          jsDoc: {
            doc: "Conecta al servidor antiguo.",
            tags: [
              { kind: "deprecated", doc: "Usa `connectV2()` en su lugar." },
              { kind: "example", doc: "await legacyConnect('localhost');" },
            ],
          },
        },
      ],
    },
  ]);
  assertStringIncludes(taggedMd, "OBSOLETO (DEPRECATED)");
  assertStringIncludes(taggedMd, "Usa `connectV2()` en su lugar.");
  assertStringIncludes(taggedMd, "await legacyConnect('localhost');");
});

Deno.test("Docgen Strict: Validates documented symbols and rejects undocumented ones", async () => {
  const symbols = await extractDenoDoc("src/core/search.ts");
  const issues = validateSymbolsDocumentation(symbols);
  assertEquals(issues.length, 0);

  // Synthetic undocumented symbol must trigger strict validation error
  const brokenIssues = validateSymbolsDocumentation([
    {
      name: "undocumentedHelper",
      declarations: [
        {
          kind: "function",
          declarationKind: "export",
          location: { filename: "file:///src/demo.ts", line: 10, col: 0 },
        },
      ],
    },
  ]);
  assertEquals(brokenIssues.length, 1);
  assertStringIncludes(brokenIssues[0].message, "undocumentedHelper");

  // Strict generateApiDocs succeeds on fully documented entrypoints
  const md = await generateApiDocs({
    entrypoints: ["src/core/search.ts"],
    strict: true,
  });
  assertStringIncludes(md, "SearchIndexer");
});

Deno.test("Test:Docs: Extracts, validates and executes Markdown code blocks", async () => {
  const sampleMd = `
\`\`\`ts run [ejemplo.ts]
const a: number = 10;
const b: number = 20;
if (a + b !== 30) throw new Error("Math broken");
\`\`\`
`;
  const blocks = extractMarkdownCodeBlocks(sampleMd, "sample.md");
  assertEquals(blocks.length, 1);
  assertEquals(blocks[0].isRunnable, true);

  const res = await validateCodeBlock(blocks[0]);
  assertEquals(res.passed, true);

  // All real project documentation blocks in docs/ must pass
  const allDocsResults = await runDocsTests("docs");
  const failed = allDocsResults.filter((r) => !r.passed);
  assertEquals(failed.length, 0);
});
