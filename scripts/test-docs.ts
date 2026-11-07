/**
 * Testable Markdown Code Blocks Runner for Zerho (`deno task test:docs`).
 * Extracts TypeScript and JavaScript code blocks from Markdown documentation,
 * verifies their syntax, and executes `ts run` blocks to prevent broken examples.
 */

import { walk } from "@std/fs";

export interface DocCodeBlock {
  file: string;
  line: number;
  lang: string;
  label?: string;
  isRunnable: boolean;
  code: string;
}

export interface DocBlockTestResult {
  block: DocCodeBlock;
  passed: boolean;
  error?: string;
  durationMs: number;
}

/**
 * Extracts all TypeScript and JavaScript fenced code blocks from a Markdown string.
 */
export function extractMarkdownCodeBlocks(markdown: string, file = "doc.md"): DocCodeBlock[] {
  const blocks: DocCodeBlock[] = [];
  const fenceRegex = /```([^\r\n`]*)\r?\n([\s\S]*?)\r?\n```/g;

  let match;
  while ((match = fenceRegex.exec(markdown)) !== null) {
    const rawHeader = match[1].trim();
    const code = match[2];

    if (!rawHeader || /\b(ignore|no-test)\b/i.test(rawHeader)) {
      continue;
    }

    const prefixBeforeLine = markdown.slice(0, match.index);
    const line = prefixBeforeLine.split(/\r?\n/).length;

    const isRunnable = /\brun\b|:run/i.test(rawHeader);
    const cleanedHeader = rawHeader.replace(/\brun\b|:run/gi, "").trim();

    let lang = cleanedHeader.split(/[\s\[:]/)[0]?.toLowerCase() || "";
    if (lang === "typescript") lang = "ts";
    if (lang === "javascript") lang = "js";

    if (lang !== "ts" && lang !== "js") {
      continue;
    }

    const labelMatch = rawHeader.match(/\[(.*?)\]/);
    const label = labelMatch ? labelMatch[1] : undefined;

    blocks.push({
      file,
      line,
      lang,
      label,
      isRunnable,
      code,
    });
  }

  return blocks;
}

/**
 * Strips TypeScript annotations so snippets can be syntax-checked and executed in V8.
 */
export function stripTypeScriptForTest(code: string): string {
  let cleaned = code
    .replace(/^import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, (m) => `// ${m}`)
    .replace(/^import\s+["'][^"']+["'];?\s*$/gm, (m) => `// ${m}`)
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+(?=(?:const|let|var|function|async|class|interface|type)\b)/gm, "")
    .replace(/interface\s+\w+(?:<[^>]+>)?\s*\{[\s\S]*?\}/g, "")
    .replace(/^type\s+\w+(?:<[^>]+>)?\s*=\s*[^;]+;?/gm, "")
    .replace(
      /\)\s*:\s*(?:Promise<[^>]+>|Record<[^>]+>|Array<[^>]+>|[A-Za-z0-9_<>[\]|]+)(?=\s*(?:\{|=>))/g,
      ")",
    )
    .replace(
      /(\b(?:const|let|var)\s+[A-Za-z0-9_$]+)\s*:\s*(?:Record<[^>]+>|Array<[^>]+>|[A-Za-z0-9_<>[\]|]+)(?=\s*=)/g,
      "$1",
    )
    .replace(
      /([,(]\s*(?:\.\.\.)?[A-Za-z0-9_$]+)\??\s*:\s*(?:Record<[^>]+>|Array<[^>]+>|[A-Za-z0-9_<>[\]|]+)(?=\s*[,)=])/g,
      "$1",
    )
    .replace(/\bas\s+[A-Za-z0-9_<>[\]|]+/g, "")
    .replace(/\[\s*\.\.\.\s*\]/g, "[]")
    .replace(/\{\s*\.\.\.\s*\}/g, "{}");

  // Support configuration object property fragments in docs (e.g. `nav: [ ... ]` or `sidebar: { ... }`)
  const trimmed = cleaned.trim();
  if (/^[a-zA-Z0-9_$]+\s*:\s*[\[{]/.test(trimmed)) {
    cleaned = `const __docConfigFragment = {\n${trimmed.replace(/;\s*$/, "")}\n};`;
  }

  return cleaned;
}

/**
 * Validates a single Markdown code block (syntax check for all TS/JS blocks, plus live execution for `run` blocks).
 */
export async function validateCodeBlock(block: DocCodeBlock): Promise<DocBlockTestResult> {
  const start = performance.now();
  const jsCode = stripTypeScriptForTest(block.code);

  try {
    // 1. Verify valid JavaScript/V8 syntax compilation
    const compiledFn = new Function(
      "Deno",
      "console",
      `return (async () => {\n${jsCode}\n});`,
    );

    // 2. If marked with `run`, execute the block and verify zero runtime errors
    if (block.isRunnable) {
      const logs: string[] = [];
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        info: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        warn: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      };

      const mockDeno = {
        version: Deno.version,
        env: {
          get: (key: string) => {
            const defaults: Record<string, string> = {
              DENO_ENV: "production",
              REGION: "deno-deploy-sao-1",
              PORT: "8000",
            };
            return defaults[key];
          },
        },
        readTextFile: (path: string) => Promise.resolve(`// Simulated content for ${path}`),
        serve: () => ({ finished: Promise.resolve() }),
      };

      const runner = compiledFn(mockDeno, mockConsole);
      await runner();
    }

    return {
      block,
      passed: true,
      durationMs: performance.now() - start,
    };
  } catch (err) {
    return {
      block,
      passed: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: performance.now() - start,
    };
  }
}

/**
 * Scans a documentation directory and validates all TypeScript/JavaScript code blocks.
 */
export async function runDocsTests(docsDir = "docs"): Promise<DocBlockTestResult[]> {
  const results: DocBlockTestResult[] = [];

  for await (const entry of walk(docsDir, { exts: [".md"], includeDirs: false })) {
    const relPath = entry.path.replace(/\\/g, "/");
    if (relPath.endsWith("reference.md")) continue;

    const content = await Deno.readTextFile(entry.path);
    const blocks = extractMarkdownCodeBlocks(content, relPath);

    for (const block of blocks) {
      const res = await validateCodeBlock(block);
      results.push(res);
    }
  }

  return results;
}

if (import.meta.main) {
  console.log("🧪 [Zerho Test:Docs] Verificando bloques de código en archivos Markdown...");
  const start = performance.now();
  const results = await runDocsTests("docs");
  const duration = (performance.now() - start).toFixed(1);

  const failed = results.filter((r) => !r.passed);
  const runnableCount = results.filter((r) => r.block.isRunnable).length;

  if (failed.length > 0) {
    console.error(
      `\n❌ \x1b[31m[Test:Docs Fallido]\x1b[0m ${failed.length} de ${results.length} bloque(s) con errores:\n`,
    );
    for (const f of failed) {
      console.error(
        `  - ${f.block.file}:${f.block.line} (${f.block.lang}${
          f.block.isRunnable ? " run" : ""
        }): ${f.error}`,
      );
    }
    Deno.exit(1);
  }

  console.log(
    `✅ \x1b[32m[Test:Docs Aprobado]\x1b[0m ${results.length} bloques verificados (${runnableCount} ejecutados en vivo) en ${duration}ms.\n`,
  );
}
