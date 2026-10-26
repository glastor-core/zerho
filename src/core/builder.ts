import { walk } from "@std/fs";
import { dirname, join, relative } from "@std/path";
import config from "../../zerho.config.ts";
import { parseMarkdown } from "./markdown.ts";
import { SearchIndexer } from "./search.ts";
import { renderPage } from "../templates/layout.ts";

export interface BuildOptions {
  devMode?: boolean;
  outDir?: string;
  docsDir?: string;
}

/**
 * Generates standards-compliant sitemap.xml for SEO crawlers.
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
 */
export function generateRobotsTxt(baseUrl = "https://zerho.xyz"): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

export async function buildSite(options: BuildOptions = {}) {
  const startTime = performance.now();
  const docsDir = options.docsDir || join(Deno.cwd(), "docs");
  const outDir = options.outDir || join(Deno.cwd(), "dist");
  const devMode = options.devMode || false;

  console.log(`\n⚡ \x1b[35m[Zerho]\x1b[0m Compilando sitio para Deno...`);

  // Ensure output directories
  await Deno.mkdir(outDir, { recursive: true });
  await Deno.mkdir(join(outDir, "assets"), { recursive: true });

  const indexer = new SearchIndexer();
  const routes: string[] = [];
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

    // Index content for full-text search
    indexer.addDocument({
      id: routePath,
      url: routePath,
      title: parsed.frontmatter.title || config.title,
      section: parsed.frontmatter.layout === "home" ? "Inicio" : routePath.split("/")[1] || "Docs",
      content: parsed.plainText.slice(0, 1500),
    });

    // Also index individual h2/h3 sections for direct anchor jumping
    for (const heading of parsed.toc) {
      indexer.addDocument({
        id: `${routePath}#${heading.id}`,
        url: `${routePath}#${heading.id}`,
        title: parsed.frontmatter.title || config.title,
        section: heading.text,
        content: heading.text,
      });
    }

    // Render HTML page
    const htmlOutput = renderPage({
      config,
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

  // Save search index
  await Deno.writeTextFile(join(outDir, "search-index.json"), indexer.toJSON());

  const duration = (performance.now() - startTime).toFixed(1);
  console.log(
    `✨ \x1b[32m[Zerho Exitoso]\x1b[0m ${pageCount} páginas compiladas, sitemap generado e indexadas en ${duration}ms\n`,
  );
}

if (import.meta.main) {
  await buildSite({ devMode: false });
}
