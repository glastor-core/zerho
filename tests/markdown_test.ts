import { assertEquals, assertStringIncludes } from "@std/assert";
import { parseMarkdown } from "../src/core/markdown.ts";

Deno.test("Markdown: Parse frontmatter metadata", async () => {
  const md = `---
title: Título de Prueba
description: Descripción de prueba
layout: doc
---
# Contenido principal`;

  const result = await parseMarkdown(md);
  assertEquals(result.frontmatter.title, "Título de Prueba");
  assertEquals(result.frontmatter.description, "Descripción de prueba");
  assertEquals(result.frontmatter.layout, "doc");
  assertStringIncludes(result.html, "<h1");
});

Deno.test("Markdown: Transform VitePress callouts (::: tip, ::: warning, ::: danger)", async () => {
  const md = `::: tip NOTA PRO
Este es un consejo avanzado para Deno 2.
:::

::: warning ADVERTENCIA
Ten cuidado con las variables no inicializadas.
:::`;

  const result = await parseMarkdown(md);
  assertStringIncludes(result.html, 'class="callout callout-tip"');
  assertStringIncludes(result.html, "<span>NOTA PRO</span>");
  assertStringIncludes(result.html, 'class="callout callout-warning"');
  assertStringIncludes(result.html, "<span>ADVERTENCIA</span>");
});

Deno.test("Markdown: Transform GitHub alert syntax (> [!NOTE])", async () => {
  const md = `> [!NOTE]
> Esta es una nota estilo GitHub Alert.`;

  const result = await parseMarkdown(md);
  assertStringIncludes(result.html, 'class="callout callout-info"');
  assertStringIncludes(result.html, "<span>NOTE</span>");
  assertStringIncludes(result.html, "Esta es una nota estilo GitHub Alert.");
});

Deno.test("Markdown: Render code block with file tab title [server.ts]", async () => {
  const md = "```ts [server.ts]\nconsole.log('hello world');\n```";

  const result = await parseMarkdown(md);
  assertStringIncludes(result.html, 'class="code-block-wrap"');
  assertStringIncludes(result.html, "TS [SERVER.TS]");
  assertStringIncludes(result.html, 'class="copy-code-btn"');
});

Deno.test("Markdown: Render runnable code blocks (```ts run)", async () => {
  const md = "```ts run\nconst x: number = 42;\nconsole.log(x);\n```";

  const result = await parseMarkdown(md);
  assertStringIncludes(result.html, 'class="runnable-card"');
  assertStringIncludes(result.html, 'class="run-execute-btn"');
  assertStringIncludes(result.html, "<span>Ejecutar en Deno</span>");
  assertStringIncludes(result.html, 'class="runnable-console"');
});

Deno.test("Markdown: Extract Table of Contents (TOC) hierarchy", async () => {
  const md = `# Título Principal
## Primer Paso
Contenido 1
### Subsección de Configuración
Contenido sub
## Segundo Paso
Final`;

  const result = await parseMarkdown(md);
  assertEquals(result.toc.length, 3);
  assertEquals(result.toc[0].text, "Primer Paso");
  assertEquals(result.toc[0].level, 2);
  assertEquals(result.toc[1].text, "Subsección de Configuración");
  assertEquals(result.toc[1].level, 3);
  assertEquals(result.toc[2].text, "Segundo Paso");
  assertEquals(result.toc[2].level, 2);
});

Deno.test("Markdown: Extract clean plainText without HTML tags", async () => {
  const md = `---
title: Demo
---
# Encabezado
Este es un **texto formateado** con <span style="color:red">HTML</span>.`;

  const result = await parseMarkdown(md);
  assertStringIncludes(result.plainText, "Este es un texto formateado con HTML");
});

Deno.test("Markdown: Parse polyglot ::: code-group tabs", async () => {
  const md = `::: code-group
\`\`\`bash [Deno]
deno add jsr:@zerho/zerho
\`\`\`

\`\`\`bash [npm]
npx jsr add @zerho/zerho
\`\`\`

\`\`\`bash [pnpm]
pnpm dlx jsr add @zerho/zerho
\`\`\`
:::`;

  const result = await parseMarkdown(md);
  assertStringIncludes(result.html, 'class="code-group"');
  assertStringIncludes(result.html, 'class="code-group-tabs"');
  assertStringIncludes(result.html, 'data-tab="Deno"');
  assertStringIncludes(result.html, 'data-tab="npm"');
  assertStringIncludes(result.html, 'data-tab="pnpm"');
  assertStringIncludes(result.html, 'class="code-group-tab active"');
  assertStringIncludes(result.html, 'data-tab-panel="Deno"');
  assertStringIncludes(result.html, 'class="code-group-panel active"');
  assertStringIncludes(result.html, 'style="display: none;"');
  assertStringIncludes(result.html, 'class="copy-code-btn code-group-copy-btn"');
});
