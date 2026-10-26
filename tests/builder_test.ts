import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { buildSite } from "../src/core/builder.ts";

Deno.test("Builder: Build static site into output directory", async () => {
  const tmpBase = await Deno.makeTempDir({ prefix: "zerho_test_" });
  const docsDir = join(tmpBase, "docs");
  const outDir = join(tmpBase, "dist");

  await Deno.mkdir(docsDir, { recursive: true });

  // Create sample docs
  await Deno.writeTextFile(
    join(docsDir, "index.md"),
    `---
title: Inicio de Prueba
layout: home
hero:
  title: Zerho Test
  tagline: Probando el compilador SSG
---
# Página de Inicio`,
  );

  await Deno.writeTextFile(
    join(docsDir, "guide.md"),
    `---
title: Guía Rápida
---
## Primer Capítulo
Contenido del primer capítulo con información relevante.`,
  );

  try {
    // Run build
    await buildSite({
      docsDir,
      outDir,
      devMode: false,
    });

    // Check generated files
    const indexHtml = await Deno.readTextFile(join(outDir, "index.html"));
    assertStringIncludes(indexHtml, "<!DOCTYPE html>");
    assertStringIncludes(indexHtml, "Inicio de Prueba");
    assertStringIncludes(indexHtml, "/assets/theme.css");
    assertStringIncludes(indexHtml, "/assets/app.js");

    const guideHtml = await Deno.readTextFile(join(outDir, "guide.html"));
    assertStringIncludes(guideHtml, "Guía Rápida");
    assertStringIncludes(guideHtml, "Primer Capítulo");

    // Check search index
    const searchIndexStr = await Deno.readTextFile(join(outDir, "search-index.json"));
    const searchIndex = JSON.parse(searchIndexStr);
    assertEquals(Array.isArray(searchIndex), true);
    assertEquals(searchIndex.length >= 2, true);

    // Check copied assets
    const themeCss = await Deno.readTextFile(join(outDir, "assets", "theme.css"));
    assertStringIncludes(themeCss, "--brand-primary");

    const appJs = await Deno.readTextFile(join(outDir, "assets", "app.js"));
    assertStringIncludes(appJs, "switchSearchTab");

    const openapiJs = await Deno.readTextFile(join(outDir, "assets", "openapi-client.js"));
    assertStringIncludes(openapiJs, "renderOpenApiExplorer");
  } finally {
    // Clean up temp dir
    await Deno.remove(tmpBase, { recursive: true });
  }
});
