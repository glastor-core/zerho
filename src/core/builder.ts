import { walk } from "@std/fs";
import { dirname, join, relative } from "@std/path";
import config, { type ZerhoConfig } from "../../zerho.config.ts";
import { parseMarkdown } from "./markdown.ts";
import { SearchIndexer } from "./search.ts";
import { renderPage } from "../templates/layout.ts";
import { generateApiDocs } from "./docgen.ts";

/** Options configuring the Zerho static site generator compilation process. */
export interface BuildOptions {
  /** Run builder in development mode enabling livereload and development banners */
  devMode?: boolean;
  /** Output directory path for compiled static assets (defaults to 'dist') */
  outDir?: string;
  /** Source documentation directory containing Markdown files (defaults to 'docs') */
  docsDir?: string;
  /** Skip automatic generation of API reference documentation via deno doc */
  skipDocgen?: boolean;
}

/** Represents an indexed page entry prepared for LLM and agent ingestion. */
export interface LlmsPageEntry {
  /** Title of the document */
  title: string;
  /** Summary description extracted from frontmatter or generated */
  description: string;
  /** Canonical route URL path */
  route: string;
  /** Clean Markdown content ready for LLM consumption */
  rawContent: string;
}

/**
 * Generates standards-compliant sitemap.xml for search engines and SEO crawlers.
 * @param routes List of canonical URL paths to include in the sitemap
 * @param baseUrl Canonical production domain origin
 * @returns Formatted XML sitemap string
 */
export function generateSitemapXml(routes: string[], baseUrl = "https://zerho.xyz"): string {
  const today = new Date().toISOString().split("T")[0];
  const urlEntries = routes
    .map((route) => {
      const priority = route === "/" ? "1.0" : "0.8";
      const changefreq = route === "/" ? "daily" : "weekly";
      const loc = route === "/" ? `${baseUrl}/` : `${baseUrl}${route}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;
}

/**
 * Generates robots.txt pointing to the production sitemap.
 * @param baseUrl Canonical production domain origin
 * @returns Formatted robots.txt string
 */
export function generateRobotsTxt(baseUrl = "https://zerho.xyz"): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

/**
 * Generates /llms.txt according to the llmstxt.org specification for LLM agents.
 * @param pages Indexed documentation pages
 * @param baseUrl Canonical production domain origin
 * @param siteTitle Site brand title
 * @param siteDescription Concise tagline or description
 * @returns Formatted Markdown llms.txt string
 */
export function generateLlmsTxt(
  pages: LlmsPageEntry[],
  baseUrl = "https://zerho.xyz",
  siteTitle = "Zerho",
  siteDescription =
    "El motor de documentación de nivel pro diseñado nativamente para Deno & Deno Deploy",
): string {
  const docLinks = pages
    .filter((p) => p.route !== "/")
    .map((p) => {
      const url = `${baseUrl}${p.route}`;
      const desc = p.description ? `: ${p.description}` : "";
      return `- [${p.title}](${url})${desc}`;
    })
    .join("\n");

  return `# ${siteTitle}

> ${siteDescription}

Zerho es un generador de documentación técnica y SSG construido para Deno 2 y Deno Deploy, con playground interactivo, explorador OpenAPI y búsqueda instantánea.

## Documentación

${docLinks}

## Contexto para Agentes y LLMs

- [Documentación Completa Unificada](/llms-full.txt): Toda la documentación técnica consolidada en un solo archivo Markdown para modelos de lenguaje.
- [Sitemap XML](/sitemap.xml): Índice de rutas canónicas para indexación.
`;
}

/**
 * Generates /llms-full.txt containing the entire concatenated documentation for direct LLM ingestion.
 * @param pages Indexed documentation pages
 * @param baseUrl Canonical production domain origin
 * @param siteTitle Site brand title
 * @returns Consolidated Markdown documentation string
 */
export function generateLlmsFullTxt(
  pages: LlmsPageEntry[],
  baseUrl = "https://zerho.xyz",
  siteTitle = "Zerho",
): string {
  const sections = pages.map((p) => {
    const url = p.route === "/" ? `${baseUrl}/` : `${baseUrl}${p.route}`;
    const cleanBody = p.rawContent.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
    return `# ${p.title}\n\n**URL:** ${url}\n**Descripción:** ${
      p.description || "N/A"
    }\n\n${cleanBody}`;
  });

  return `# ${siteTitle} — Documentación Técnica Completa para LLMs

> Documentación unificada para modelos de lenguaje, asistentes y agentes de programación.

---

${sections.join("\n\n---\n\n")}
`;
}

/**
 * Resolves effective configuration applying locale overrides if currentPath belongs to a registered locale.
 * @param baseConfig Global root Zerho configuration
 * @param path Current route path being rendered
 * @returns Localized configuration object
 */
export function resolveConfigForPath(baseConfig: ZerhoConfig, path: string): ZerhoConfig {
  if (!baseConfig.locales) return baseConfig;

  for (const [prefix, locale] of Object.entries(baseConfig.locales)) {
    if (prefix === "root") continue;
    const prefixSlash = `/${prefix}/`;
    if (path.startsWith(prefixSlash) || path === `/${prefix}`) {
      return {
        ...baseConfig,
        lang: locale.lang || baseConfig.lang,
        title: locale.title || baseConfig.title,
        tagline: locale.tagline || baseConfig.tagline,
        description: locale.description || baseConfig.description,
        themeConfig: {
          ...baseConfig.themeConfig,
          nav: locale.nav || baseConfig.themeConfig.nav,
          sidebar: locale.sidebar || baseConfig.themeConfig.sidebar,
        },
      };
    }
  }

  return baseConfig;
}

/**
 * Compiles Markdown documentation into static HTML, CSS, search index, and LLM endpoints.
 * @param options Build configuration options
 * @returns Promise resolving when site compilation is complete
 */
export async function buildSite(options: BuildOptions = {}): Promise<void> {
  const startTime = performance.now();
  const docsDir = options.docsDir || join(Deno.cwd(), "docs");
  const outDir = options.outDir || join(Deno.cwd(), "dist");
  const devMode = options.devMode || false;

  console.log(`\n⚡ \x1b[35m[Zerho]\x1b[0m Compilando sitio para Deno...`);

  // Ensure output directories
  await Deno.mkdir(outDir, { recursive: true });
  await Deno.mkdir(join(outDir, "assets"), { recursive: true });

  // Optional: Auto-generate API reference via deno doc if configured
  if (config.apiDocs && !options.skipDocgen) {
    try {
      const apiMarkdown = await generateApiDocs({
        entrypoints: config.apiDocs.entrypoints,
        title: config.apiDocs.title,
      });
      await Deno.writeTextFile(join(docsDir, "reference.md"), apiMarkdown);
    } catch (e) {
      console.warn("No se pudo auto-generar reference.md:", e);
    }
  }

  const indexer = new SearchIndexer();
  const routes: string[] = [];
  const pagesForLlms: LlmsPageEntry[] = [];
  let pageCount = 0;

  // Process all markdown files
  for await (const entry of walk(docsDir, { exts: [".md"] })) {
    if (!entry.isFile) continue;

    const relPath = relative(docsDir, entry.path);
    const content = await Deno.readTextFile(entry.path);

    // Derive route path
    let routePath = "/" + relPath.replace(/\\/g, "/").replace(/\.md$/, "");
    if (routePath.endsWith("/index")) {
      routePath = routePath.slice(0, -6) || "/";
    }
    routes.push(routePath);

    const parsed = await parseMarkdown(content);
    const effectiveConfig = resolveConfigForPath(config, routePath);
    const pageTitle = parsed.frontmatter.title || effectiveConfig.title;
    const pageDesc = parsed.frontmatter.description || effectiveConfig.description;

    pagesForLlms.push({
      title: pageTitle,
      description: pageDesc,
      route: routePath,
      rawContent: content,
    });

    // Index content for full-text search
    indexer.addDocument({
      id: routePath,
      url: routePath,
      title: pageTitle,
      section: parsed.frontmatter.layout === "home" ? "Inicio" : routePath.split("/")[1] || "Docs",
      content: parsed.plainText.slice(0, 1500),
    });

    // Also index individual h2/h3 sections for direct anchor jumping
    for (const heading of parsed.toc) {
      indexer.addDocument({
        id: `${routePath}#${heading.id}`,
        url: `${routePath}#${heading.id}`,
        title: pageTitle,
        section: heading.text,
        content: heading.text,
      });
    }

    // Render HTML page
    const htmlOutput = renderPage({
      config: effectiveConfig,
      parsed,
      currentPath: routePath,
      devMode,
    });

    // Write file to output directory
    let targetFile = "";
    if (routePath === "/") {
      targetFile = join(outDir, "index.html");
    } else {
      targetFile = join(outDir, `${relPath.replace(/\.md$/, ".html")}`);
    }

    await Deno.mkdir(dirname(targetFile), { recursive: true });
    await Deno.writeTextFile(targetFile, htmlOutput);
    pageCount++;
  }

  // Copy client static assets
  const clientDir = join(Deno.cwd(), "src", "client");
  await Deno.copyFile(join(clientDir, "theme.css"), join(outDir, "assets", "theme.css"));
  await Deno.copyFile(join(clientDir, "app.js"), join(outDir, "assets", "app.js"));
  await Deno.copyFile(join(clientDir, "playground.js"), join(outDir, "assets", "playground.js"));
  await Deno.copyFile(
    join(clientDir, "openapi-client.js"),
    join(outDir, "assets", "openapi-client.js"),
  );

  // Copy Cloudflare Pages routing files if present
  try {
    await Deno.copyFile(join(clientDir, "_headers"), join(outDir, "_headers"));
    await Deno.copyFile(join(clientDir, "_redirects"), join(outDir, "_redirects"));
  } catch (_e) {
    // Ignore if not present in test environments
  }

  // Generate sitemap.xml and robots.txt
  await Deno.writeTextFile(join(outDir, "sitemap.xml"), generateSitemapXml(routes));
  await Deno.writeTextFile(join(outDir, "robots.txt"), generateRobotsTxt());

  // Generate llms.txt and llms-full.txt
  await Deno.writeTextFile(join(outDir, "llms.txt"), generateLlmsTxt(pagesForLlms));
  await Deno.writeTextFile(join(outDir, "llms-full.txt"), generateLlmsFullTxt(pagesForLlms));

  // Save search index
  await Deno.writeTextFile(join(outDir, "search-index.json"), indexer.toJSON());

  const duration = (performance.now() - startTime).toFixed(1);
  console.log(
    `✨ \x1b[32m[Zerho Exitoso]\x1b[0m ${pageCount} páginas compiladas, sitemap, llms.txt e indexación en ${duration}ms\n`,
  );
}

if (import.meta.main) {
  await buildSite({ devMode: false });
}
