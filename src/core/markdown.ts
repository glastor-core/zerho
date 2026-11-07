import { extname, join, resolve } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import { marked } from "marked";
import Prism from "prismjs";
import { type OpenApiSpec, renderOpenApiExplorer } from "./openapi.ts";

// Ensure global Prism is available for dynamic components
(globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;

// Import core & polyglot languages for multi-project documentation
await import("prismjs/components/prism-typescript");
await import("prismjs/components/prism-bash");
await import("prismjs/components/prism-json");
await import("prismjs/components/prism-yaml");
await import("prismjs/components/prism-css");
await import("prismjs/components/prism-python");
await import("prismjs/components/prism-go");
await import("prismjs/components/prism-rust");
await import("prismjs/components/prism-sql");
await import("prismjs/components/prism-graphql");
await import("prismjs/components/prism-docker");
await import("prismjs/components/prism-toml");
await import("prismjs/components/prism-diff");

/** Represents an entry in the document's Table of Contents (TOC) hierarchy. */
export interface TocItem {
  /** Unique anchor fragment identifier */
  id: string;
  /** Visible heading title text */
  text: string;
  /** Heading depth level (e.g. 2 for h2, 3 for h3) */
  level: number;
}

/** Schema for document YAML frontmatter metadata and layout settings. */
export interface Frontmatter {
  /** Document page title */
  title?: string;
  /** Meta description for search engines and SEO */
  description?: string;
  /** Numeric ordering index used when generating automatic sidebars */
  order?: number;
  /** Layout mode: 'doc' for documentation with sidebar, 'home' for hero landing, 'page' for generic */
  layout?: "doc" | "home" | "page";
  /** Hero banner configuration for landing pages */
  hero?: {
    name?: string;
    title?: string;
    text?: string;
    tagline?: string;
    badge?: string;
    codePreview?: {
      title?: string;
      lang?: string;
      code: string;
    };
    actions?: Array<{
      theme?: "brand" | "alt" | "interactive";
      text: string;
      link: string;
    }>;
  };
  /** Feature cards displayed on landing pages */
  features?: Array<{
    icon?: string;
    title: string;
    details: string;
  }>;
  /** Whether to render an edit link pointing to the repository source */
  editLink?: boolean;
  /** Previous page navigation link */
  prev?: { text: string; link: string };
  /** Next page navigation link */
  next?: { text: string; link: string };
  [key: string]: unknown;
}

/** Result of compiling a Markdown document with frontmatter, HTML, and analytics. */
export interface ParsedMarkdown {
  /** Extracted YAML frontmatter metadata */
  frontmatter: Frontmatter;
  /** Rendered HTML output with syntax highlighting and callouts */
  html: string;
  /** Extracted Table of Contents hierarchy for the right sidebar */
  toc: TocItem[];
  /** Estimated reading time in minutes */
  readingTimeMin: number;
  /** Total word count of the body */
  wordCount: number;
  /** Plain text representation used for full-text search indexing */
  plainText: string;
}

/**
 * Normalizes a heading string into a URL-safe, accent-free anchor slug.
 * @param text Raw heading text
 * @returns Normalized URL slug
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlightCode(code: string, lang: string): string {
  const normalizedLang = lang.toLowerCase().trim();
  const grammarMap: Record<string, string> = {
    ts: "typescript",
    typescript: "typescript",
    js: "javascript",
    javascript: "javascript",
    py: "python",
    python: "python",
    go: "go",
    golang: "go",
    rs: "rust",
    rust: "rust",
    sql: "sql",
    gql: "graphql",
    graphql: "graphql",
    docker: "docker",
    dockerfile: "docker",
    toml: "toml",
    diff: "diff",
    bash: "bash",
    sh: "bash",
    shell: "bash",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    css: "css",
    html: "markup",
    xml: "markup",
    svg: "markup",
    markup: "markup",
  };

  const grammarName = grammarMap[normalizedLang] || "typescript";
  const grammar = Prism.languages[grammarName] || Prism.languages.javascript;
  if (!grammar) return escapeHtml(code);
  try {
    return Prism.highlight(code, grammar, grammarName);
  } catch {
    return escapeHtml(code);
  }
}

/**
 * Transforms custom container callouts like ::: tip, ::: info, ::: warning, ::: danger
 */
function processCallouts(markdown: string): string {
  const renderCalloutBox = (type: string, title: string | undefined, content: string): string => {
    const defaultTitles: Record<string, string> = {
      info: "INFORMACIÓN",
      tip: "CONSEJO",
      warning: "ADVERTENCIA",
      danger: "PELIGRO",
      details: "DETALLES",
    };
    const displayTitle = title ? title.trim() : defaultTitles[type] || type.toUpperCase();

    const icons: Record<string, string> = {
      info:
        `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
      tip:
        `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
      warning:
        `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger:
        `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      details:
        `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
    };

    if (type === "details") {
      return `\n\n<details class="callout callout-details">
<summary class="callout-title">${icons.details}<span>${escapeHtml(displayTitle)}</span></summary>
<div class="callout-content">\n\n${content.trim()}\n\n</div>
</details>\n\n`;
    }

    return `\n\n<div class="callout callout-${type}">
<div class="callout-title">${icons[type] || ""}<span>${escapeHtml(displayTitle)}</span></div>
<div class="callout-content">\n\n${content.trim()}\n\n</div>
</div>\n\n`;
  };

  // 1. Standard multiline container: ::: info [TITLE]\n...\n:::
  const containerRegex =
    /^:::\s*(info|tip|warning|danger|details)(?:[ \t]+([^\r\n]+))?\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm;
  let result = markdown.replace(
    containerRegex,
    (_match, type, title, content) => renderCalloutBox(type, title, content),
  );

  // 2. deno fmt inline-wrapped callout: ::: info [TITLE] body... :::
  const inlineWrappedRegex =
    /^:::\s*(info|tip|warning|danger|details)[ \t]+([A-ZÁÉÍÓÚÑÜ\s]{2,25}?)[ \t]+([\s\S]*?)\s+:::[ \t]*$/gm;
  result = result.replace(
    inlineWrappedRegex,
    (_match, type, title, content) => renderCalloutBox(type, title, content),
  );

  return result;
}

/**
 * Transforms GitHub style alerts (> [!NOTE], > [!TIP], etc.)
 */
function processGitHubAlerts(markdown: string): string {
  const alertRegex =
    /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\r?\n((?:>[ \t]*[^\r\n]*\r?\n?)*)/gim;
  return markdown.replace(alertRegex, (_match, alertType, bodyLines) => {
    const rawContent = bodyLines
      .split(/\r?\n/)
      .map((l: string) => l.replace(/^>[ \t]?/, ""))
      .join("\n")
      .trim();

    const typeMap: Record<string, string> = {
      note: "info",
      tip: "tip",
      important: "info",
      warning: "warning",
      caution: "danger",
    };
    const mappedType = typeMap[alertType.toLowerCase()] || "info";
    return `::: ${mappedType} ${alertType.toUpperCase()}\n${rawContent}\n:::`;
  });
}

/**
 * Transforms VitePress-style `::: code-group` blocks into tabbed interactive HTML code panels.
 * @param markdown Raw Markdown content containing code-group directives
 * @returns Transformed Markdown with HTML tab structures
 */
export function processCodeGroups(markdown: string): string {
  const codeGroupRegex = /^:::\s*code-group[ \t]*\r?\n([\s\S]*?)\r?\n:::/gm;

  return markdown.replace(codeGroupRegex, (_match, groupBody) => {
    const blockRegex = /```([^\r\n]*)\r?\n([\s\S]*?)\r?\n```/g;
    const blocks: Array<{ lang: string; label: string; code: string }> = [];

    let blockMatch;
    while ((blockMatch = blockRegex.exec(groupBody)) !== null) {
      const langLine = blockMatch[1].trim();
      const code = blockMatch[2];

      let language = "text";
      let label = "";

      const titleMatch = langLine.match(/^([a-zA-Z0-9_-]+)(?:\s*\[(.*?)\]|:\s*(.*?))?$/);
      if (titleMatch) {
        language = titleMatch[1] || "text";
        label = titleMatch[2] || titleMatch[3] || "";
      } else {
        language = langLine.split(/\s+/)[0] || "text";
      }

      if (!label) {
        label = language.toUpperCase();
      }

      blocks.push({ lang: language, label, code });
    }

    if (blocks.length === 0) {
      return groupBody;
    }

    const tabsHtml = blocks
      .map((block, index) => {
        const activeClass = index === 0 ? " active" : "";
        const ariaSelected = index === 0 ? "true" : "false";
        const safeLabel = escapeHtml(block.label);
        return `<button class="code-group-tab${activeClass}" role="tab" type="button" aria-selected="${ariaSelected}" data-tab="${safeLabel}">${safeLabel}</button>`;
      })
      .join("");

    const panelsHtml = blocks
      .map((block, index) => {
        const activeClass = index === 0 ? " active" : "";
        const displayStyle = index === 0 ? "" : ' style="display: none;"';
        const highlighted = highlightCode(block.code, block.lang);
        const safeLabel = escapeHtml(block.label);

        return `
<div class="code-group-panel${activeClass}" role="tabpanel" data-tab-panel="${safeLabel}"${displayStyle}>
  <pre class="code-pre"><code class="language-${block.lang}">${highlighted}</code></pre>
  <textarea class="raw-code" style="display:none;">${escapeHtml(block.code)}</textarea>
</div>`;
      })
      .join("");

    return `\n\n<div class="code-group" data-code-group>
  <div class="code-group-header">
    <div class="code-group-tabs" role="tablist">
      ${tabsHtml}
    </div>
    <button class="copy-code-btn code-group-copy-btn" type="button" aria-label="Copiar código" title="Copiar código">
      <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span class="copy-feedback">Copiado!</span>
    </button>
  </div>
  <div class="code-group-panels">
    ${panelsHtml}
  </div>
</div>\n\n`;
  });
}

/**
 * Resolves and inlines Markdown partial includes (`<!-- @include: ./partial.md -->`)
 * @param markdown Raw Markdown content
 * @param baseDir Base directory used to resolve relative paths
 * @returns Markdown with included files expanded inline
 */
export async function processMarkdownIncludes(
  markdown: string,
  baseDir: string = Deno.cwd(),
): Promise<string> {
  const includeRegex = /^[ \t]*<!--\s*@include:\s*([^\s>]+)\s*-->[ \t]*$/gm;
  const matches = [...markdown.matchAll(includeRegex)];
  if (matches.length === 0) return markdown;

  let result = markdown;
  for (const m of matches) {
    const rawTarget = m[1].trim();
    const relTarget = rawTarget.startsWith("@/") ? rawTarget.slice(2) : rawTarget;
    const resolvedPath = resolve(baseDir, relTarget);
    if (!resolvedPath.startsWith(resolve(baseDir))) {
      continue;
    }
    try {
      const includedText = await Deno.readTextFile(resolvedPath);
      result = result.replace(m[0], includedText.trim());
    } catch {
      console.warn(`[Markdown] No se pudo incluir el archivo: ${rawTarget}`);
    }
  }
  return result;
}

/**
 * Resolves VitePress-style source code transclusions (`<<< @/src/file.ts#L1-L10 [label]`)
 * directly from the project repository so code examples never go out of sync.
 * @param markdown Raw Markdown content
 * @param baseDir Base directory of the project workspace
 * @returns Markdown with transcluded source files converted into fenced code blocks
 */
export async function processCodeTransclusions(
  markdown: string,
  baseDir: string = Deno.cwd(),
): Promise<string> {
  const transcludeRegex =
    /^<<<[ \t]+(@?\/?[^\s#\[\r\n]+)(?:#L(\d+)(?:-L?(\d+))?)?(?:[ \t]+\[([^\]]+)\])?[ \t]*$/gm;
  const matches = [...markdown.matchAll(transcludeRegex)];
  if (matches.length === 0) return markdown;

  let result = markdown;
  for (const m of matches) {
    const rawPath = m[1].trim();
    const startLine = m[2] ? parseInt(m[2], 10) : undefined;
    const endLine = m[3] ? parseInt(m[3], 10) : startLine;
    const customLabel = m[4] ? m[4].trim() : "";

    const cleanRel = rawPath.replace(/^@\//, "").replace(/^\//, "");
    const resolvedPath = resolve(baseDir, cleanRel);
    if (!resolvedPath.startsWith(resolve(baseDir))) {
      continue;
    }

    try {
      const fileContent = await Deno.readTextFile(resolvedPath);
      const lines = fileContent.split(/\r?\n/);
      const sliced = startLine !== undefined
        ? lines.slice(Math.max(0, startLine - 1), endLine ?? startLine).join("\n")
        : fileContent.trimEnd();

      const ext = extname(cleanRel).replace(/^\./, "").toLowerCase() || "ts";
      const fileLabel = customLabel || join(cleanRel).replace(/\\/g, "/").split("/").pop() ||
        cleanRel;
      const fenced = `\`\`\`${ext}[${fileLabel}]\n${sliced}\n\`\`\``;
      result = result.replace(m[0], fenced);
    } catch {
      console.warn(`[Markdown] No se pudo transcluir archivo de código: ${rawPath}`);
    }
  }
  return result;
}

/**
 * Transforms `::: steps ... :::` containers into a numbered vertical stepper guide.
 * @param markdown Raw Markdown content
 * @returns Markdown with stepper containers converted into structured HTML
 */
export function processSteps(markdown: string): string {
  const stepsRegex = /^:::\s*steps[ \t]*\r?\n([\s\S]*?)\r?\n:::/gm;
  return markdown.replace(stepsRegex, (_match, body) => {
    const rawItems = body.trim().split(/(?=^###\s+)/m).filter((s: string) => s.trim().length > 0);
    const itemsHtml = rawItems
      .map((itemText: string, idx: number) => {
        const headingMatch = itemText.match(/^###\s+([^\r\n]+)\r?\n?([\s\S]*)$/);
        const title = headingMatch ? headingMatch[1].trim() : `Paso ${idx + 1}`;
        const content = headingMatch ? headingMatch[2].trim() : itemText.trim();
        return `<div class="z-step-item">
  <div class="z-step-badge">${idx + 1}</div>
  <div class="z-step-content">
    <h4 class="z-step-title">${escapeHtml(title)}</h4>
    <div class="z-step-body">\n\n${content}\n\n</div>
  </div>
</div>`;
      })
      .join("\n");
    return `\n\n<div class="z-steps">\n${itemsHtml}\n</div>\n\n`;
  });
}

/**
 * Transforms `::: tabs ... :::` with `@tab Title` directives into general-purpose interactive content tabs.
 * @param markdown Raw Markdown content
 * @returns Markdown with content tabs rendered as accessible tablist panels
 */
export function processContentTabs(markdown: string): string {
  const tabsRegex = /^:::\s*tabs[ \t]*\r?\n([\s\S]*?)\r?\n:::/gm;
  return markdown.replace(tabsRegex, (_match, body) => {
    const parts = body.split(/^@tab[ \t]+([^\r\n]+)\r?\n/gm);
    const tabs: Array<{ label: string; content: string }> = [];
    for (let i = 1; i < parts.length; i += 2) {
      tabs.push({
        label: parts[i].trim(),
        content: (parts[i + 1] || "").trim(),
      });
    }
    if (tabs.length === 0) return body;

    const buttonsHtml = tabs
      .map((t, idx) => {
        const active = idx === 0 ? " active" : "";
        return `<button type="button" class="z-tab-btn${active}" data-z-tab-idx="${idx}">${
          escapeHtml(t.label)
        }</button>`;
      })
      .join("");

    const panelsHtml = tabs
      .map((t, idx) => {
        const active = idx === 0 ? " active" : "";
        const style = idx === 0 ? "" : ' style="display:none;"';
        return `<div class="z-tab-panel${active}" data-z-panel-idx="${idx}"${style}>\n\n${t.content}\n\n</div>`;
      })
      .join("\n");

    return `\n\n<div class="z-tabs" data-z-tabs>
  <div class="z-tabs-header" role="tablist">${buttonsHtml}</div>
  <div class="z-tabs-body">\n${panelsHtml}\n</div>
</div>\n\n`;
  });
}

/**
 * Transforms `::: cards ... :::` directives into a Mintlify/Starlight-style responsive feature card grid.
 * Format per line: `- [Title](url) :: Description` or `- [Icon] [Title](url) :: Description`
 * @param markdown Raw Markdown content
 * @returns Markdown with card grids converted into HTML cards
 */
export function processCardsGrid(markdown: string): string {
  const cardsRegex = /^:::\s*cards[ \t]*\r?\n([\s\S]*?)\r?\n:::/gm;
  return markdown.replace(cardsRegex, (_match, body) => {
    const lines = body
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => l.startsWith("- "));

    const cardsHtml = lines
      .map((line: string) => {
        const raw = line.replace(/^-\s+/, "");
        const linkMatch = raw.match(/^(?:([^\[]+?)\s+)?\[([^\]]+)\]\(([^)]+)\)(?:\s*::\s*(.*))?$/);
        if (linkMatch) {
          const icon = (linkMatch[1] || "⚡").trim();
          const title = linkMatch[2].trim();
          const href = linkMatch[3].trim();
          const desc = (linkMatch[4] || "").trim();
          return `<a href="${escapeHtml(href)}" class="z-doc-card">
  <div class="z-doc-card-head">
    <span class="z-doc-card-icon">${escapeHtml(icon)}</span>
    <span class="z-doc-card-title">${escapeHtml(title)}</span>
  </div>
  ${desc ? `<p class="z-doc-card-desc">${escapeHtml(desc)}</p>` : ""}
</a>`;
        }
        return `<div class="z-doc-card"><p class="z-doc-card-desc">${escapeHtml(raw)}</p></div>`;
      })
      .join("\n");

    return `\n\n<div class="z-cards-grid">\n${cardsHtml}\n</div>\n\n`;
  });
}

/**
 * Transforms `::: file-tree ... :::` containers into a styled directory & file hierarchy tree.
 * @param markdown Raw Markdown content
 * @returns Markdown with file-tree lists rendered with folder and file icons
 */
export function processFileTree(markdown: string): string {
  const treeRegex = /^:::\s*file-tree[ \t]*\r?\n([\s\S]*?)\r?\n:::/gm;
  return markdown.replace(treeRegex, (_match, body) => {
    const lines = body.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
    const itemsHtml = lines
      .map((line: string) => {
        const indentMatch = line.match(/^(\s*)[-*]?\s*(.+)$/);
        const spaces = indentMatch ? indentMatch[1].length : 0;
        const depth = Math.floor(spaces / 2);
        const rawLabel = indentMatch ? indentMatch[2].trim() : line.trim();
        const isDir = rawLabel.endsWith("/");
        const icon = isDir ? "📁" : "📄";
        return `<div class="z-tree-row" style="padding-left: ${depth * 18}px">
  <span class="z-tree-icon">${icon}</span>
  <code class="z-tree-name ${isDir ? "is-dir" : "is-file"}">${escapeHtml(rawLabel)}</code>
</div>`;
      })
      .join("\n");
    return `\n\n<div class="z-file-tree">\n${itemsHtml}\n</div>\n\n`;
  });
}

/**
 * Transforms LaTeX mathematical expressions (`$$...$$` display blocks and `$...$` inline formulas)
 * into semantic math containers for KaTeX rendering, ignoring fenced code blocks and currency values.
 * @param markdown Raw Markdown content
 * @returns Markdown with math formulas wrapped in `.math-block` and `.math-inline` elements
 */
export function processMathExpressions(markdown: string): string {
  const codeBlockPlaceholders: string[] = [];
  let protectedMd = markdown.replace(/```[\s\S]*?```|`[^`\r\n]+`/g, (m) => {
    codeBlockPlaceholders.push(m);
    return `@@ZERHO_CODE_${codeBlockPlaceholders.length - 1}@@`;
  });

  // Display math $$...$$
  protectedMd = protectedMd.replace(/\$\$\r?\n?([\s\S]+?)\r?\n?\$\$/g, (_m, expr) => {
    return `\n\n<div class="math-block" data-math-display="true">$$${
      escapeHtml(expr.trim())
    }$$</div>\n\n`;
  });

  // Inline math $...$ (must not start/end with space or be followed by digits like currency $100)
  protectedMd = protectedMd.replace(
    /(?<![\\$])\$(?!\s|\d)([^\$\r\n]+?)(?<!\s)\$(?!\$)/g,
    (_m, expr) => {
      return `<span class="math-inline" data-math-inline="true">$${
        escapeHtml(expr.trim())
      }$</span>`;
    },
  );

  return protectedMd.replace(
    /@@ZERHO_CODE_(\d+)@@/g,
    (_m, idx) => codeBlockPlaceholders[Number(idx)],
  );
}

/**
 * Parses raw Markdown text into structured HTML, extracting frontmatter, TOC, and reading time.
 * @param rawContent Raw Markdown file content including frontmatter
 * @param baseDir Optional project root directory for resolving code transclusions and includes
 * @returns Promise resolving to the parsed document metadata and HTML
 */
export async function parseMarkdown(
  rawContent: string,
  baseDir: string = Deno.cwd(),
): Promise<ParsedMarkdown> {
  let frontmatter: Frontmatter = {};
  let markdownBody = rawContent;

  // Frontmatter extraction
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
  const fmMatch = rawContent.match(fmRegex);
  if (fmMatch) {
    try {
      frontmatter = (parseYaml(fmMatch[1]) as Frontmatter) || {};
      markdownBody = rawContent.slice(fmMatch[0].length);
    } catch (e) {
      console.warn("Error parsing YAML frontmatter:", e);
    }
  }

  // Pre-process includes, source code transclusions, math, declarative components, alerts, callouts, and code groups
  let processedMarkdown = await processMarkdownIncludes(markdownBody, baseDir);
  processedMarkdown = await processCodeTransclusions(processedMarkdown, baseDir);
  processedMarkdown = processMathExpressions(processedMarkdown);
  processedMarkdown = processGitHubAlerts(processedMarkdown);
  processedMarkdown = processSteps(processedMarkdown);
  processedMarkdown = processContentTabs(processedMarkdown);
  processedMarkdown = processCardsGrid(processedMarkdown);
  processedMarkdown = processFileTree(processedMarkdown);
  processedMarkdown = processCallouts(processedMarkdown);
  processedMarkdown = processCodeGroups(processedMarkdown);

  const toc: TocItem[] = [];
  const seenSlugs = new Map<string, number>();
  const renderer = new marked.Renderer();

  // Headings
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((t) => t.raw).join("");
    const baseSlug = slugify(text) || "section";
    const count = seenSlugs.get(baseSlug) || 0;
    seenSlugs.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    if (depth >= 2 && depth <= 3) {
      toc.push({
        id: slug,
        text: text.replace(/<[^>]+>/g, ""),
        level: depth,
      });
    }

    return `
<h${depth} id="${slug}" class="heading-anchor-wrap">
  <span>${text}</span>
  <a href="#${slug}" class="header-anchor" aria-label="Permalink to ${escapeHtml(text)}">#</a>
</h${depth}>`;
  };

  // Code blocks: runnable or static with copy button and title bar
  renderer.code = ({ text, lang }) => {
    const code = text;
    let language = (lang || "").trim();
    let filename = "";
    let isRunnable = false;

    // Detect filename pattern: e.g. ts [server.ts] or ts:server.ts
    const titleMatch = language.match(/^(\w+)(?:\[(.*?)\]|:(.*))$/);
    if (titleMatch) {
      language = titleMatch[1];
      filename = titleMatch[2] || titleMatch[3] || "";
    }

    // Detect runnable flag: e.g. `ts run` or `typescript run`
    if (language.includes("run") || language.endsWith(":run")) {
      isRunnable = true;
      language = language.replace(/\brun\b|:run/g, "").trim() || "typescript";
    }

    // Mermaid diagram
    if (language.toLowerCase() === "mermaid") {
      return `
<div class="mermaid-block">
  <div class="mermaid-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M10 7h4"/><path d="M7 10v4"/><path d="M17 10v4"/></svg> Diagrama Mermaid</div>
  <pre class="mermaid">${escapeHtml(code)}</pre>
</div>`;
    }

    // Native OpenAPI block (JSON or YAML - supports both simplified endpoints[] and official OpenAPI 3.0/3.1 paths{})
    if (language.toLowerCase() === "openapi" || language.toLowerCase() === "openapi-json") {
      try {
        const parsedSpec = (
          code.trim().startsWith("{") ? JSON.parse(code) : parseYaml(code)
        ) as Record<string, unknown>;
        if (
          parsedSpec &&
          (Array.isArray(parsedSpec.endpoints) ||
            (parsedSpec.paths && typeof parsedSpec.paths === "object"))
        ) {
          return renderOpenApiExplorer(parsedSpec as unknown as OpenApiSpec);
        }
      } catch (e) {
        console.warn("Error parsing OpenAPI block:", e);
      }
    }

    const highlighted = highlightCode(code, language || "text");
    const langLabel = (language || "text").toUpperCase();

    // If marked as runnable, embed interactive live playground block
    if (isRunnable) {
      const codeId = "run_" + Math.random().toString(36).substring(2, 9);
      const encodedCode = encodeURIComponent(code);
      return `
<div class="runnable-card" id="${codeId}" data-code="${encodedCode}" data-lang="${language}">
  <div class="runnable-header">
    <div class="runnable-title">
      <span class="runnable-dot"></span>
      <span class="runnable-badge">Deno Sandbox</span>
      ${filename ? `<span class="code-title-tab">${escapeHtml(filename)}</span>` : ""}
    </div>
    <div class="runnable-actions">
      <button class="run-execute-btn" onclick="executeSnippet('${codeId}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Ejecutar en Deno</span>
      </button>
      <button class="open-playground-btn" onclick="openInPlayground('${codeId}')" title="Clonar y abrir en el Playground interactivo">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        <span>Abrir en Playground</span>
      </button>
      <button class="copy-btn" onclick="copySnippet('${codeId}')" title="Copiar código">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      </button>
    </div>
  </div>
  <div class="runnable-editor-wrap">
    <pre class="code-pre"><code class="language-${language}">${highlighted}</code></pre>
  </div>
  <div class="runnable-console" id="${codeId}_console" style="display: none;">
    <div class="console-header">
      <span>Terminal de Salida</span>
      <span class="console-status" id="${codeId}_status">Listo</span>
    </div>
    <pre class="console-output" id="${codeId}_output"></pre>
  </div>
</div>`;
    }

    // Standard static code block with copy button, title, and optional "Abrir en Playground" for TS/JS
    const copyId = "code_" + Math.random().toString(36).substring(2, 9);
    const isTsOrJs = ["ts", "typescript", "js", "javascript"].includes(language.toLowerCase());
    const encodedStaticCode = isTsOrJs ? ` data-code="${encodeURIComponent(code)}"` : "";
    const playgroundActionHtml = isTsOrJs
      ? `
      <button class="open-playground-btn" onclick="openInPlayground('${copyId}')" title="Clonar y abrir en el Playground interactivo">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        <span>Abrir en Playground</span>
      </button>`
      : "";

    return `
<div class="code-block-wrap" id="${copyId}"${encodedStaticCode}>
  <div class="code-block-header">
    <div class="code-header-left">
      ${
      filename
        ? `<span class="code-title-tab">${escapeHtml(filename)}</span>`
        : `<span class="code-lang-badge">${langLabel}</span>`
    }
    </div>
    <div class="code-header-actions">${playgroundActionHtml}
      <button class="copy-code-btn" onclick="copyCodeBlock('${copyId}')" aria-label="Copiar código">
        <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span class="copy-feedback">Copiado!</span>
      </button>
    </div>
  </div>
  <pre class="code-pre"><code class="language-${language}">${highlighted}</code></pre>
  <textarea class="raw-code" style="display:none;">${escapeHtml(code)}</textarea>
</div>`;
  };

  // Tables
  renderer.table = ({ header, rows }) => {
    let headerHtml = "";
    if (header) {
      headerHtml = `<thead><tr>${
        header.map((cell) => `<th>${cell.tokens.map((t) => t.raw).join("")}</th>`).join("")
      }</tr></thead>`;
    }
    const rowsHtml = `<tbody>${
      rows.map((row) =>
        `<tr>${
          row.map((cell) => `<td>${cell.tokens.map((t) => t.raw).join("")}</td>`).join("")
        }</tr>`
      ).join("")
    }</tbody>`;
    return `<div class="table-responsive"><table class="docs-table">${headerHtml}${rowsHtml}</table></div>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    renderer,
  });

  const html = await marked.parse(processedMarkdown);

  // Calculate words and reading time
  const plainText = markdownBody.replace(/<[^>]+>/g, " ").replace(/[#*`~_-]/g, " ").replace(
    /\s+/g,
    " ",
  ).trim();
  const words = plainText ? plainText.split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(words / 200));

  return {
    frontmatter,
    html,
    toc,
    readingTimeMin,
    wordCount: words,
    plainText,
  };
}
