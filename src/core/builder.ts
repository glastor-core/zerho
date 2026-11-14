import { walk } from "@std/fs";
import { dirname, extname, isAbsolute, join, relative, toFileUrl } from "@std/path";
import config, { type SidebarItem, type ZerhoConfig } from "../../zerho.config.ts";
import { type ParsedMarkdown, parseMarkdown } from "./markdown.ts";
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
  /** Strict internal link validation (fails build if any broken links exist) */
  strictLinks?: boolean;
  /** Canonical production domain URL override */
  siteUrl?: string;
  /** Optional explicit ZerhoConfig override */
  config?: ZerhoConfig;
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
 * Generates an RSS 2.0 XML feed (/feed.xml) for documentation updates and release syndication.
 * @param pages Indexed documentation pages
 * @param baseUrl Canonical production domain origin
 * @param siteTitle Site brand title
 * @param siteDescription Concise tagline or description
 * @returns Standards-compliant RSS 2.0 XML string
 */
export function generateRssFeedXml(
  pages: LlmsPageEntry[],
  baseUrl = "https://zerho.xyz",
  siteTitle = "Zerho",
  siteDescription = "Documentación técnica impulsada por Zerho",
): string {
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const pubDate = new Date().toUTCString();
  const itemsXml = pages
    .map((p) => {
      const link = p.route === "/" ? `${baseUrl}/` : `${baseUrl}${p.route}`;
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <description>${escapeXml(p.description || p.title)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <lastBuildDate>${pubDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;
}

/**
 * Generates a dynamic OpenGraph SVG preview card (1200x630) for social sharing on X, Discord, and Slack.
 * @param title Page title
 * @param description Page summary description
 * @param siteTitle Brand or project title
 * @param primaryColor Primary brand hex color
 * @returns Complete 1200x630 SVG document string
 */
export function generateOgImageSvg(
  title: string,
  description: string,
  siteTitle = "Zerho",
  primaryColor = "#7c3aed",
): string {
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const safeTitle = escapeXml(title.slice(0, 68));
  const safeDesc = escapeXml(description.slice(0, 120));
  const safeBrand = escapeXml(siteTitle);
  const safeColor = escapeXml(primaryColor);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090a0f"/>
      <stop offset="100%" stop-color="#121424"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${safeColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${safeColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="64" y="64" width="1072" height="502" rx="24" fill="none" stroke="${safeColor}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="116" y="156" fill="#06b6d4" font-family="system-ui, sans-serif" font-size="26" font-weight="700" letter-spacing="1">${safeBrand}</text>
  <text x="116" y="290" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="56" font-weight="800">${safeTitle}</text>
  <text x="116" y="370" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="28" font-weight="400">${safeDesc}</text>
  <text x="116" y="505" fill="#64748b" font-family="monospace" font-size="22">Powered by Zerho • Deno 2 Documentation Engine</text>
</svg>`;
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

/** Represents a broken internal link or missing anchor fragment detected during site compilation. */
export interface DeadLinkIssue {
  /** Route of the page containing the broken link */
  sourceRoute: string;
  /** Target href attribute that failed validation */
  targetHref: string;
  /** Human-readable explanation of why the link is invalid */
  reason: string;
}

/**
 * Dynamically loads a project's local `zerho.config.ts` from the given workspace root,
 * falling back to the default engine configuration if not present.
 * @param workspaceDir Project root directory (defaults to Deno.cwd())
 * @returns Resolved ZerhoConfig object
 */
export async function loadUserConfig(workspaceDir: string = Deno.cwd()): Promise<ZerhoConfig> {
  const localConfigPath = join(workspaceDir, "zerho.config.ts");
  try {
    await Deno.stat(localConfigPath);
    const mod = await import(toFileUrl(localConfigPath).href);
    const userCfg = (mod.default || mod.config) as Partial<ZerhoConfig> | undefined;
    if (userCfg && typeof userCfg === "object") {
      return {
        ...config,
        ...userCfg,
        themeConfig: {
          ...config.themeConfig,
          ...(userCfg.themeConfig || {}),
        },
      };
    }
  } catch {
    // Use default fallback config
  }
  return config;
}

/**
 * Generates an automatic sidebar hierarchy from discovered documentation pages,
 * grouped by top-level directory and sorted by frontmatter `order` then title.
 * @param pages Discovered compiled pages with routes and parsed metadata
 * @returns Generated array of SidebarItem groups
 */
export function generateAutoSidebar(
  pages: Array<{ routePath: string; parsed: ParsedMarkdown }>,
): SidebarItem[] {
  const groups = new Map<
    string,
    Array<{ text: string; link: string; order: number }>
  >();

  for (const p of pages) {
    if (
      p.routePath === "/" ||
      p.routePath === "/index" ||
      p.parsed.frontmatter.layout === "home"
    ) {
      continue;
    }

    const segments = p.routePath.replace(/^\//, "").split("/");
    const groupKey = segments.length > 1 ? segments[0] : "Documentación";
    const groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1).replace(/-/g, " ");
    const itemTitle = p.parsed.frontmatter.title ||
      segments[segments.length - 1].replace(/-/g, " ");
    const order = typeof p.parsed.frontmatter.order === "number" ? p.parsed.frontmatter.order : 999;

    const list = groups.get(groupLabel) || [];
    list.push({ text: itemTitle, link: p.routePath, order });
    groups.set(groupLabel, list);
  }

  const sidebar: SidebarItem[] = [];
  for (const [groupTitle, items] of groups.entries()) {
    items.sort((a, b) => a.order - b.order || a.text.localeCompare(b.text));
    sidebar.push({
      text: groupTitle,
      items: items.map(({ text, link }) => ({ text, link })),
    });
  }
  return sidebar;
}

/**
 * Validates internal links and heading anchors across all compiled documentation pages.
 * @param pages Compiled pages with route, rendered HTML, and table-of-contents anchor IDs
 * @param knownRoutes Set of valid canonical routes in the site
 * @returns List of broken internal links or missing anchor targets
 */
export function validateInternalLinks(
  pages: Array<{ route: string; html: string; tocIds: Set<string> }>,
  knownRoutes: Set<string>,
): DeadLinkIssue[] {
  const issues: DeadLinkIssue[] = [];
  const pageAnchors = new Map<string, Set<string>>();

  const normalizeRoute = (
    r: string,
  ) => (r === "/" ? "/" : r.replace(/\/$/, "").replace(/\.html$/, ""));

  const normalizedRoutes = new Set<string>();
  for (const r of knownRoutes) {
    normalizedRoutes.add(normalizeRoute(r));
  }

  for (const p of pages) {
    pageAnchors.set(normalizeRoute(p.route), p.tocIds);
  }

  const hrefRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>/gi;

  for (const p of pages) {
    let match;
    while ((match = hrefRegex.exec(p.html)) !== null) {
      const href = match[1].trim();
      if (
        !href ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("javascript:") ||
        href.startsWith("/assets/") ||
        href === "#top" ||
        href === "#"
      ) {
        continue;
      }

      if (href.startsWith("#")) {
        const anchorId = href.slice(1);
        if (anchorId && !p.tocIds.has(anchorId)) {
          issues.push({
            sourceRoute: p.route,
            targetHref: href,
            reason: `El ancla '#${anchorId}' no existe en la página '${p.route}'.`,
          });
        }
        continue;
      }

      if (href.startsWith("/")) {
        const [pathPart, hashPart] = href.split("#");
        const normTarget = normalizeRoute(pathPart || "/");
        if (!normalizedRoutes.has(normTarget)) {
          issues.push({
            sourceRoute: p.route,
            targetHref: href,
            reason: `La ruta interna '${pathPart}' no corresponde a ninguna página compilada.`,
          });
        } else if (hashPart) {
          const targetAnchors = pageAnchors.get(normTarget);
          if (targetAnchors && targetAnchors.size > 0 && !targetAnchors.has(hashPart)) {
            issues.push({
              sourceRoute: p.route,
              targetHref: href,
              reason: `El ancla '#${hashPart}' no existe en la página destino '${pathPart}'.`,
            });
          }
        }
      }
    }
  }

  return issues;
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
  const activeConfig = options.config || (await loadUserConfig(Deno.cwd()));
  if (options.strictLinks !== undefined) {
    activeConfig.strictLinks = options.strictLinks;
  }
  const siteUrl = (options.siteUrl || activeConfig.siteUrl || "https://zerho.xyz").replace(/\/$/, "");
  const plugins = activeConfig.plugins || [];

  console.log(`\n⚡ \x1b[35m[Zerho]\x1b[0m Compilando sitio para Deno...`);

  // Execute plugin onBeforeBuild hooks
  for (const plugin of plugins) {
    if (plugin.onBeforeBuild) {
      await plugin.onBeforeBuild(activeConfig);
    }
  }

  // Ensure source docs and output directories exist
  await Deno.mkdir(docsDir, { recursive: true });
  await Deno.mkdir(outDir, { recursive: true });
  await Deno.mkdir(join(outDir, "assets"), { recursive: true });
  await Deno.mkdir(join(outDir, "og"), { recursive: true });

  // Optional: Auto-generate API reference via deno doc if configured
  if (activeConfig.apiDocs && !options.skipDocgen) {
    try {
      const workspaceDir = options.docsDir ? dirname(options.docsDir) : Deno.cwd();
      const resolvedEntrypoints = activeConfig.apiDocs.entrypoints.map((ep) =>
        isAbsolute(ep) ? ep : join(workspaceDir, ep)
      );
      const configPath = join(workspaceDir, "deno.json");
      let hasConfig = false;
      try {
        const cStat = await Deno.stat(configPath);
        hasConfig = cStat.isFile;
      } catch {
        // No deno.json
      }
      const apiMarkdown = await generateApiDocs({
        entrypoints: resolvedEntrypoints,
        title: activeConfig.apiDocs.title,
        strict: activeConfig.apiDocs.strict,
        repoUrl: activeConfig.apiDocs.repoUrl,
        configPath: hasConfig ? configPath : undefined,
      });
      await Deno.writeTextFile(join(docsDir, "reference.md"), apiMarkdown);
    } catch (e) {
      if (activeConfig.apiDocs.strict) {
        throw e;
      }
      console.warn("No se pudo auto-generar reference.md:", e);
    }
  }

  const indexer = new SearchIndexer();
  const routes: string[] = [];
  const pagesForLlms: LlmsPageEntry[] = [];
  let pageCount = 0;

  // Phase 1: Parse all markdown files first so we can auto-generate sidebars and validate links
  const parsedPages: Array<{
    relPath: string;
    routePath: string;
    rawContent: string;
    parsed: ParsedMarkdown;
  }> = [];

  for await (const entry of walk(docsDir, { exts: [".md"] })) {
    if (!entry.isFile) continue;

    const relPath = relative(docsDir, entry.path);
    const normalizedRel = relPath.replace(/\\/g, "/");
    if (normalizedRel.startsWith("public/")) continue;

    let content = await Deno.readTextFile(entry.path);

    let routePath = "/" + normalizedRel.replace(/\.md$/, "");
    if (routePath.endsWith("/index")) {
      routePath = routePath.slice(0, -6) || "/";
    }
    routes.push(routePath);

    // Apply plugin transformMarkdown hooks
    for (const plugin of plugins) {
      if (plugin.transformMarkdown) {
        content = await plugin.transformMarkdown(content, routePath);
      }
    }

    const parsed = await parseMarkdown(content, dirname(entry.path));
    parsedPages.push({ relPath, routePath, rawContent: content, parsed });
  }

  // Resolve auto-sidebar if configured
  const autoSidebar = activeConfig.themeConfig.sidebar === "auto"
    ? generateAutoSidebar(parsedPages)
    : undefined;

  // Phase 2: Index and render HTML for all pages
  const linkCheckPages: Array<{ route: string; html: string; tocIds: Set<string> }> = [];

  for (const page of parsedPages) {
    const { relPath, routePath, rawContent, parsed } = page;
    const effectiveConfig = resolveConfigForPath(activeConfig, routePath);
    if (autoSidebar && effectiveConfig.themeConfig.sidebar === "auto") {
      effectiveConfig.themeConfig = {
        ...effectiveConfig.themeConfig,
        sidebar: autoSidebar,
      };
    }

    const pageTitle = parsed.frontmatter.title || effectiveConfig.title;
    const pageDesc = parsed.frontmatter.description || effectiveConfig.description;

    pagesForLlms.push({
      title: pageTitle,
      description: pageDesc,
      route: routePath,
      rawContent,
    });

    // Index content for full-text search
    indexer.addDocument({
      id: routePath,
      url: routePath,
      title: pageTitle,
      section: parsed.frontmatter.layout === "home" ? "Inicio" : routePath.split("/")[1] || "Docs",
      content: parsed.plainText.slice(0, 1500),
    });

    const tocIds = new Set<string>();
    for (const heading of parsed.toc) {
      tocIds.add(heading.id);
      indexer.addDocument({
        id: `${routePath}#${heading.id}`,
        url: `${routePath}#${heading.id}`,
        title: pageTitle,
        section: heading.text,
        content: heading.text,
      });
    }

    // Also collect h1-h6 IDs present in parsed.html
    for (const idMatch of parsed.html.matchAll(/<h[1-6]\s+id="([^"]+)"/gi)) {
      tocIds.add(idMatch[1]);
    }

    linkCheckPages.push({ route: routePath, html: parsed.html, tocIds });

    // Generate dynamic OpenGraph SVG preview card for this route
    const ogSlug = routePath === "/" ? "index" : routePath.replace(/^\//, "").replace(/\//g, "-");
    const ogSvg = generateOgImageSvg(
      pageTitle,
      pageDesc,
      effectiveConfig.title,
      effectiveConfig.themeConfig.colors?.primary || "#7c3aed",
    );
    await Deno.writeTextFile(join(outDir, "og", `${ogSlug}.svg`), ogSvg);

    // Render HTML page
    let htmlOutput = renderPage({
      config: effectiveConfig,
      parsed,
      currentPath: routePath,
      devMode,
      rawMarkdown: rawContent,
    });

    // Apply plugin transformHtml hooks
    for (const plugin of plugins) {
      if (plugin.transformHtml) {
        htmlOutput = await plugin.transformHtml(htmlOutput, routePath);
      }
    }

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

  // Phase 3: Validate internal links and anchors
  const knownRoutesSet = new Set<string>([
    ...routes,
    "/llms.txt",
    "/llms-full.txt",
    "/sitemap.xml",
    "/feed.xml",
  ]);
  const linkIssues = validateInternalLinks(linkCheckPages, knownRoutesSet);
  if (linkIssues.length > 0) {
    const details = linkIssues
      .map((i) => `  - [${i.sourceRoute}] -> ${i.targetHref}: ${i.reason}`)
      .join("\n");
    if (activeConfig.strictLinks) {
      throw new Error(
        `[Link Checker] Se detectaron ${linkIssues.length} enlace(s) interno(s) roto(s):\n${details}`,
      );
    } else {
      console.warn(
        `⚠️  [Link Checker] ${linkIssues.length} enlace(s) interno(s) roto(s) detectado(s):\n${details}`,
      );
    }
  }

  // Copy project static public directory (docs/public/* -> dist/*) and relative media assets
  const publicDir = join(docsDir, "public");
  try {
    const pubStat = await Deno.stat(publicDir);
    if (pubStat.isDirectory) {
      for await (const entry of walk(publicDir)) {
        if (!entry.isFile) continue;
        const relPub = relative(publicDir, entry.path);
        const destPub = join(outDir, relPub);
        await Deno.mkdir(dirname(destPub), { recursive: true });
        await Deno.copyFile(entry.path, destPub);
      }
    }
  } catch {
    // Optional docs/public directory not present
  }

  const staticExts = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".pdf",
    ".mp4",
    ".webm",
    ".json",
    ".yaml",
    ".yml",
  ]);
  for await (const entry of walk(docsDir)) {
    if (!entry.isFile) continue;
    const relAsset = relative(docsDir, entry.path);
    if (relAsset.replace(/\\/g, "/").startsWith("public/")) continue;
    const ext = extname(entry.path).toLowerCase();
    if (staticExts.has(ext)) {
      const destAsset = join(outDir, relAsset);
      await Deno.mkdir(dirname(destAsset), { recursive: true });
      await Deno.copyFile(entry.path, destAsset);
    }
  }

  // Copy engine client static assets
  const clientDir = import.meta.dirname
    ? join(import.meta.dirname, "..", "client")
    : join(Deno.cwd(), "src", "client");
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

  // Generate sitemap.xml, robots.txt, and RSS 2.0 feed.xml
  await Deno.writeTextFile(join(outDir, "sitemap.xml"), generateSitemapXml(routes, siteUrl));
  await Deno.writeTextFile(join(outDir, "robots.txt"), generateRobotsTxt(siteUrl));
  await Deno.writeTextFile(
    join(outDir, "feed.xml"),
    generateRssFeedXml(pagesForLlms, siteUrl, activeConfig.title, activeConfig.description),
  );

  // Generate llms.txt and llms-full.txt
  await Deno.writeTextFile(
    join(outDir, "llms.txt"),
    generateLlmsTxt(pagesForLlms, siteUrl, activeConfig.title, activeConfig.tagline),
  );
  await Deno.writeTextFile(
    join(outDir, "llms-full.txt"),
    generateLlmsFullTxt(pagesForLlms, siteUrl, activeConfig.title),
  );

  // Save search index
  await Deno.writeTextFile(join(outDir, "search-index.json"), indexer.toJSON());

  // Execute plugin onAfterBuild hooks
  for (const plugin of plugins) {
    if (plugin.onAfterBuild) {
      await plugin.onAfterBuild({ outDir, routes });
    }
  }

  const duration = (performance.now() - startTime).toFixed(1);
  console.log(
    `✨ \x1b[32m[Zerho Exitoso]\x1b[0m ${pageCount} páginas compiladas, sitemap, llms.txt e indexación en ${duration}ms\n`,
  );
}

if (import.meta.main) {
  await buildSite({ devMode: false });
}
