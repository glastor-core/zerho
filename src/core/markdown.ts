import { parse as parseYaml } from "@std/yaml";
import { marked } from "marked";
import Prism from "prismjs";

// Ensure global Prism is available for dynamic components
(globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;

// Import languages
await import("npm:prismjs/components/prism-typescript.js");
await import("npm:prismjs/components/prism-bash.js");
await import("npm:prismjs/components/prism-json.js");
await import("npm:prismjs/components/prism-yaml.js");
await import("npm:prismjs/components/prism-css.js");

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface Frontmatter {
  title?: string;
  description?: string;
  layout?: "doc" | "home" | "page";
  hero?: {
    name?: string;
    text?: string;
    tagline?: string;
    actions?: Array<{
      theme: "brand" | "alt";
      text: string;
      link: string;
    }>;
  };
  features?: Array<{
    icon?: string;
    title: string;
    details: string;
  }>;
  editLink?: boolean;
  prev?: { text: string; link: string };
  next?: { text: string; link: string };
  [key: string]: unknown;
}

export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  html: string;
  toc: TocItem[];
  readingTimeMin: number;
  wordCount: number;
  plainText: string;
}

function slugify(text: string): string {
  return text
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
    bash: "bash",
    sh: "bash",
    shell: "bash",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    css: "css",
    html: "markup",
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
  const containerRegex = /^:::\s*(info|tip|warning|danger|details)(?:[ \t]+([^\r\n]+))?\r?\n([\s\S]*?)\r?\n:::/gm;

  return markdown.replace(containerRegex, (_match, type, title, content) => {
    const defaultTitles: Record<string, string> = {
      info: "INFORMACIÓN",
      tip: "CONSEJO",
      warning: "ADVERTENCIA",
      danger: "PELIGRO",
      details: "DETALLES",
    };
    const displayTitle = title ? title.trim() : defaultTitles[type] || type.toUpperCase();

    const icons: Record<string, string> = {
      info: `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
      tip: `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
      warning: `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      details: `<svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
    };

    if (type === "details") {
      return `\n\n<details class="callout callout-details">
<summary class="callout-title">${icons.details}<span>${escapeHtml(displayTitle)}</span></summary>
<div class="callout-content">\n\n${content}\n\n</div>
</details>\n\n`;
    }

    return `\n\n<div class="callout callout-${type}">
<div class="callout-title">${icons[type] || ""}<span>${escapeHtml(displayTitle)}</span></div>
<div class="callout-content">\n\n${content}\n\n</div>
</div>\n\n`;
  });
}

/**
 * Transforms GitHub style alerts (> [!NOTE], > [!TIP], etc.)
 */
function processGitHubAlerts(markdown: string): string {
  const alertRegex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\r?\n((?:>[ \t]*[^\r\n]*\r?\n?)*)/gim;
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

export async function parseMarkdown(rawContent: string): Promise<ParsedMarkdown> {
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

  // Pre-process GitHub alerts and custom containers
  let processedMarkdown = processGitHubAlerts(markdownBody);
  processedMarkdown = processCallouts(processedMarkdown);

  const toc: TocItem[] = [];
  const renderer = new marked.Renderer();

  // Headings
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((t) => t.raw).join("");
    const slug = slugify(text);

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
  <a href="#${slug}" class="header-anchor" aria-label="Permalink to ${text}">#</a>
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

    // Standard static code block with copy button and title
    const copyId = "code_" + Math.random().toString(36).substring(2, 9);
    return `
<div class="code-block-wrap" id="${copyId}">
  <div class="code-block-header">
    <div class="code-header-left">
      ${filename ? `<span class="code-title-tab">${escapeHtml(filename)}</span>` : `<span class="code-lang-badge">${langLabel}</span>`}
    </div>
    <button class="copy-code-btn" onclick="copyCodeBlock('${copyId}')" aria-label="Copiar código">
      <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span class="copy-feedback">Copiado!</span>
    </button>
  </div>
  <pre class="code-pre"><code class="language-${language}">${highlighted}</code></pre>
  <textarea class="raw-code" style="display:none;">${escapeHtml(code)}</textarea>
</div>`;
  };

  // Tables
  renderer.table = ({ header, rows }) => {
    let headerHtml = "";
    if (header) {
      headerHtml = `<thead><tr>${header.map((cell) => `<th>${cell.tokens.map((t) => t.raw).join("")}</th>`).join("")}</tr></thead>`;
    }
    const rowsHtml = `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell.tokens.map((t) => t.raw).join("")}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<div class="table-responsive"><table class="docs-table">${headerHtml}${rowsHtml}</table></div>`;
  };

  marked.setOptions({
    gfm: true,
    breaks: false,
    renderer,
  });

  const html = await marked.parse(processedMarkdown);

  // Calculate words and reading time
  const plainText = markdownBody.replace(/<[^>]+>/g, " ").replace(/[#*`~_-]/g, " ").replace(/\s+/g, " ").trim();
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
