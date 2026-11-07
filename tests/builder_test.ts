import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { buildSite, validateInternalLinks } from "../src/core/builder.ts";
import config from "../zerho.config.ts";

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

    // Check sitemap.xml & robots.txt
    const sitemap = await Deno.readTextFile(join(outDir, "sitemap.xml"));
    assertStringIncludes(sitemap, "https://zerho.xyz/");
    assertStringIncludes(sitemap, "<urlset");

    const robots = await Deno.readTextFile(join(outDir, "robots.txt"));
    assertStringIncludes(robots, "Sitemap: https://zerho.xyz/sitemap.xml");

    // Check llms.txt and llms-full.txt
    const llmsTxt = await Deno.readTextFile(join(outDir, "llms.txt"));
    assertStringIncludes(llmsTxt, "# Zerho");
    assertStringIncludes(llmsTxt, "https://zerho.xyz/guide");

    const llmsFullTxt = await Deno.readTextFile(join(outDir, "llms-full.txt"));
    assertStringIncludes(llmsFullTxt, "Documentación Técnica Completa para LLMs");
    assertStringIncludes(llmsFullTxt, "Primer Capítulo");
  } finally {
    // Clean up temp dir
    await Deno.remove(tmpBase, { recursive: true });
  }
});

Deno.test("Builder Multi-Project: Custom Hero/Features, Auto-Sidebar, Auto Prev/Next, Public Assets & Link Checker", async () => {
  const tmpBase = await Deno.makeTempDir({ prefix: "zerho_multiproj_" });
  const docsDir = join(tmpBase, "docs");
  const publicDir = join(docsDir, "public");
  const guideDir = join(docsDir, "guide");
  const outDir = join(tmpBase, "dist");

  await Deno.mkdir(publicDir, { recursive: true });
  await Deno.mkdir(guideDir, { recursive: true });

  // 1. Static asset inside docs/public/
  await Deno.writeTextFile(join(publicDir, "logo.svg"), `<svg><circle r="10"/></svg>`);

  // 2. Custom project landing page with custom Hero & Features
  await Deno.writeTextFile(
    join(docsDir, "index.md"),
    `---
layout: home
title: Acme Cloud SDK
hero:
  badge: v3.2 Enterprise
  title: El SDK Universal para Acme Cloud
  tagline: Conecta microservicios en Go, Python y TypeScript en segundos.
  actions:
    - theme: brand
      text: Empezar con Acme
      link: /guide/intro
features:
  - icon: 🚀
    title: Latencia Sub-Milisegundo
    details: Motor gRPC y HTTP/3 optimizado para multi-región.
---`,
  );

  // 3. Two guide pages with `order` to verify Auto-Sidebar & Auto Prev/Next pagination
  await Deno.writeTextFile(
    join(guideDir, "intro.md"),
    `---
title: Introducción a Acme
order: 1
---
## Instalación
Bienvenido a Acme SDK. Ve a [Configuración Avanzada](/guide/setup#variables).`,
  );

  await Deno.writeTextFile(
    join(guideDir, "setup.md"),
    `---
title: Configuración Avanzada
order: 2
---
## Variables
Configura tus credenciales de Acme.`,
  );

  try {
    await buildSite({
      docsDir,
      outDir,
      skipDocgen: true,
      config: {
        ...config,
        title: "Acme Cloud",
        strictLinks: true,
        themeConfig: {
          ...config.themeConfig,
          siteTitle: "Acme Cloud",
          versionBadge: "v3.2",
          ctaButton: { text: "Consola Acme", link: "https://console.acme.dev" },
          sidebar: "auto",
        },
      },
    });

    // Verify custom Hero, Features, Version Badge and CTA Button
    const indexHtml = await Deno.readTextFile(join(outDir, "index.html"));
    assertStringIncludes(indexHtml, "El SDK Universal para Acme Cloud");
    assertStringIncludes(indexHtml, "Latencia Sub-Milisegundo");
    assertStringIncludes(indexHtml, "v3.2");
    assertStringIncludes(indexHtml, "Consola Acme");

    // Verify docs/public/logo.svg was copied to dist/logo.svg
    const copiedLogo = await Deno.readTextFile(join(outDir, "logo.svg"));
    assertStringIncludes(copiedLogo, "<svg><circle");

    // Verify RSS 2.0 feed.xml and Dynamic OpenGraph SVG cards (/og/*.svg)
    const rssFeed = await Deno.readTextFile(join(outDir, "feed.xml"));
    assertStringIncludes(rssFeed, '<rss version="2.0">');
    assertStringIncludes(rssFeed, "Acme Cloud");

    const ogSvg = await Deno.readTextFile(join(outDir, "og", "guide-intro.svg"));
    assertStringIncludes(ogSvg, "Introducción a Acme");

    // Verify "Copy Markdown for AI" button and skip-to-content accessibility link
    const introHtml = await Deno.readTextFile(join(outDir, "guide", "intro.html"));
    assertStringIncludes(introHtml, "Configuración Avanzada →");
    assertStringIncludes(introHtml, 'id="copyPageMdBtn"');
    assertStringIncludes(introHtml, 'class="skip-to-content"');

    const setupHtml = await Deno.readTextFile(join(outDir, "guide", "setup.html"));
    assertStringIncludes(setupHtml, "← Introducción a Acme");

    // Verify Dead Link Checker detects broken routes and anchors
    const issues = validateInternalLinks(
      [
        {
          route: "/guide/intro",
          html: `<a href="/ruta-inexistente">Broken</a><a href="#ancla-rota">Bad Anchor</a>`,
          tocIds: new Set(["instalacion"]),
        },
      ],
      new Set(["/", "/guide/intro", "/guide/setup"]),
    );
    assertEquals(issues.length, 2);

    // Verify strictLinks throws when a broken link exists in a page
    await Deno.writeTextFile(
      join(guideDir, "broken.md"),
      `---
title: Página Rota
---
Enlace roto hacia [No Existe](/no-existe-404).`,
    );

    await assertRejects(
      async () => {
        await buildSite({
          docsDir,
          outDir,
          skipDocgen: true,
          config: {
            ...config,
            strictLinks: true,
          },
        });
      },
      Error,
      "[Link Checker]",
    );
  } finally {
    await Deno.remove(tmpBase, { recursive: true });
  }
});
