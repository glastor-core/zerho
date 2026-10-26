import type { SidebarItem, ZerhoConfig } from "../../zerho.config.ts";
import type { ParsedMarkdown } from "../core/markdown.ts";
import { VERSION } from "../version.ts";

export interface RenderPageOptions {
  config: ZerhoConfig;
  parsed: ParsedMarkdown;
  currentPath: string; // e.g. "/guide/getting-started"
  devMode?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSidebarForPath(
  sidebarConfig: Record<string, SidebarItem[]> | SidebarItem[],
  path: string,
): SidebarItem[] {
  if (Array.isArray(sidebarConfig)) {
    return sidebarConfig;
  }
  // Find longest matching prefix
  const keys = Object.keys(sidebarConfig).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (path.startsWith(key)) {
      return sidebarConfig[key];
    }
  }
  return sidebarConfig["/"] || [];
}

export function renderPage(
  { config, parsed, currentPath, devMode = false }: RenderPageOptions,
): string {
  const { frontmatter, html, toc, readingTimeMin } = parsed;
  const isEn = currentPath.startsWith("/en/") || currentPath === "/en";
  const isHome = frontmatter.layout === "home" || currentPath === "/" || currentPath === "/index" ||
    currentPath === "/en" || currentPath === "/en/";
  const isPlayground = currentPath.startsWith("/playground") ||
    currentPath.startsWith("/en/playground");
  const pageTitle = frontmatter.title
    ? `${frontmatter.title} | ${config.title}`
    : `${config.title} - ${config.tagline}`;
  const pageDesc = frontmatter.description || config.description;

  const sidebarConfig = (isEn && config.locales?.en?.sidebar)
    ? config.locales.en.sidebar
    : config.themeConfig.sidebar;
  const sidebarItems = isHome ? [] : getSidebarForPath(sidebarConfig, currentPath);

  // Render navigation items
  const activeNav = (isEn && config.locales?.en?.nav)
    ? config.locales.en.nav
    : config.themeConfig.nav;
  const navHtml = activeNav
    .map((item) => {
      const isActive = item.activeMatch
        ? currentPath.startsWith(item.activeMatch)
        : currentPath === item.link;
      return `
      <a href="${item.link}" class="nav-link ${isActive ? "active" : ""}">
        ${escapeHtml(item.text)}
        ${item.badge ? `<span class="nav-badge">${escapeHtml(item.badge)}</span>` : ""}
      </a>`;
    })
    .join("");

  // Render sidebar
  const sidebarHtml = sidebarItems
    .map((section) => {
      const itemsHtml = (section.items || [])
        .map((subItem) => {
          const isActive = currentPath === subItem.link ||
            (currentPath.replace(/\/$/, "") === (subItem.link || "").replace(/\/$/, ""));
          return `
          <li class="sidebar-item ${isActive ? "active" : ""}">
            <a href="${subItem.link || "#"}" class="sidebar-link ${isActive ? "active" : ""}">
              <span class="sidebar-text">${escapeHtml(subItem.text)}</span>
              ${
            subItem.badge
              ? `<span class="item-badge ${subItem.badge.toLowerCase()}">${
                escapeHtml(subItem.badge)
              }</span>`
              : ""
          }
            </a>
          </li>`;
        })
        .join("");

      return `
      <div class="sidebar-group">
        <div class="sidebar-group-title">${escapeHtml(section.text)}</div>
        <ul class="sidebar-group-items">
          ${itemsHtml}
        </ul>
      </div>`;
    })
    .join("");

  // Render Table of Contents (Right sidebar)
  const tocHtml = toc.length > 0
    ? `
    <nav class="toc-container">
      <div class="toc-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        <span>EN ESTA PÁGINA</span>
      </div>
      <ul class="toc-list" id="tocList">
        ${
      toc
        .map(
          (item) => `
          <li class="toc-item level-${item.level}">
            <a href="#${item.id}" class="toc-link" data-id="${item.id}">${escapeHtml(item.text)}</a>
          </li>`,
        )
        .join("")
    }
      </ul>
      <div class="toc-footer">
        <a href="#top" class="toc-action-link" onclick="window.scrollTo({top: 0, behavior: 'smooth'}); return false;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          Volver arriba
        </a>
      </div>
    </nav>`
    : "";

  // Edit link
  const editLinkUrl = config.themeConfig.editLink
    ? config.themeConfig.editLink.pattern.replace(":path", currentPath.replace(/^\//, "") + ".md")
    : null;

  return `<!DOCTYPE html>
<html lang="${config.lang}" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  <meta name="generator" content="Zerho for Deno">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(pageDesc)}">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#090a0f">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM context">
  
  <link rel="stylesheet" href="/assets/theme.css?v=${VERSION}">
  ${
    devMode
      ? `<script>
    // Live Reload WebSocket
    const ws = new WebSocket("ws://" + location.host + "/_hmr");
    ws.onmessage = (msg) => { if (msg.data === "reload") location.reload(); };
  </script>`
      : ""
  }
</head>
<body class="${isHome ? "is-home" : ""} ${isPlayground ? "is-playground" : ""}">
  <div id="top"></div>

  <!-- Ambient background glow effects -->
  <div class="ambient-glow glow-1"></div>
  <div class="ambient-glow glow-2"></div>

  <!-- Top Navigation Header -->
  <header class="site-header">
    <div class="header-inner">
      <div class="header-left">
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Abrir menú">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <a href="/" class="brand-logo">
          <div class="brand-icon-wrap">
            <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span class="brand-pulse"></span>
          </div>
          <span class="brand-name">${escapeHtml(config.title)}</span>
          <span class="version-badge">Deno 2.x</span>
        </a>
      </div>

      <nav class="header-nav">
        ${navHtml}
      </nav>

      <div class="header-right">
        <!-- Search Trigger Button (Cmd+K) -->
        <button class="search-trigger-btn" id="searchTriggerBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span class="search-placeholder">Buscar docs...</span>
          <kbd class="search-kbd"><abbr title="Command">⌘</abbr> K</kbd>
        </button>

        ${
    config.locales && Object.keys(config.locales).length > 1
      ? (() => {
        const isEn = currentPath.startsWith("/en/") || currentPath === "/en";
        const currentLangLabel = isEn ? "English" : "Español";
        const targetEn = isEn ? currentPath : (currentPath === "/" ? "/en/" : `/en${currentPath}`);
        const targetEs = isEn
          ? (currentPath === "/en/" || currentPath === "/en"
            ? "/"
            : (currentPath.replace(/^\/en/, "") || "/"))
          : currentPath;

        return `
        <!-- Language Switcher (i18n) -->
        <div class="locale-switcher" id="localeSwitcher">
          <button class="locale-btn" id="localeBtn" aria-label="Cambiar idioma" title="Cambiar idioma">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span class="locale-text">${currentLangLabel}</span>
            <svg class="locale-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="locale-dropdown" id="localeDropdown" style="display: none;">
            <a href="${targetEs}" class="locale-item ${
          !isEn ? "active" : ""
        }" data-lang="es">🇪🇸 Español</a>
            <a href="${targetEn}" class="locale-item ${
          isEn ? "active" : ""
        }" data-lang="en">🇬🇧 English</a>
          </div>
        </div>`;
      })()
      : ""
  }

        <!-- Theme Toggle -->
        <button class="theme-toggle-btn" id="themeToggleBtn" aria-label="Alternar tema">
          <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <!-- GitHub link -->
        <a href="https://github.com/glastor-core/zerho" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="GitHub">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>

        <!-- Deploy to Deno Button -->
        <a href="https://dash.deno.com" target="_blank" rel="noopener" class="deploy-action-badge">
          <span class="deno-ray"></span>
          <span>Deploy en Deno</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Layout Container -->
  <div class="site-layout">
    ${
    !isHome && sidebarItems.length > 0
      ? `
    <!-- Left Sidebar -->
    <aside class="site-sidebar" id="siteSidebar">
      <div class="sidebar-scroller">
        ${sidebarHtml}
      </div>
    </aside>
    `
      : ""
  }

    <!-- Main Content -->
    <main class="site-content ${isHome ? "content-home" : ""}">
      ${
    isHome
      ? `
      <!-- Hero Section -->
      <section class="home-hero">
        <div class="hero-badge">
          <span class="badge-icon">⚡</span>
          <span>${
        isEn ? "Native for Deno 2 & Deno Deploy" : "Nativo para Deno 2 & Deno Deploy"
      }</span>
          <span class="badge-tag">${isEn ? "PRO GRADE" : "NIVEL PRO"}</span>
        </div>
        <h1 class="hero-title">
          ${
        isEn
          ? 'Technical documentation <span class="gradient-text">ultra-fast</span> and live'
          : 'Documentación técnica <span class="gradient-text">ultrarrápida</span> y viva'
      }
        </h1>
        <p class="hero-tagline">${escapeHtml(config.tagline)}</p>
        
        <div class="hero-actions">
          <a href="${
        isEn ? "/en/guide/getting-started" : "/guide/getting-started"
      }" class="btn btn-primary glow-btn">
            <span>${isEn ? "Get Started" : "Comenzar Ahora"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <a href="/playground/" class="btn btn-interactive">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>${isEn ? "Interactive Playground" : "Playground Interactivo"}</span>
          </a>
          <a href="${
        isEn ? "/en/guide/deployment" : "/guide/deployment"
      }" class="btn btn-secondary">
            <span>Deno Deploy</span>
          </a>
        </div>

        <!-- Hero Preview Sandbox Card -->
        <div class="hero-sandbox-preview">
          <div class="hero-card-header">
            <div class="window-controls">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <span class="hero-file-tab">server.ts &bull; Deno 2 Runtime</span>
            <span class="hero-live-pill">LIVE PLAYGROUND</span>
          </div>
          <div class="hero-card-body">
            <pre class="code-pre"><code class="language-typescript"><span class="token comment">// Servidor HTTP nativo en Deno 2 con tipado estricto</span>
<span class="token keyword">import</span> <span class="token punctuation">{</span> Hono <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">"npm:hono"</span><span class="token punctuation">;</span>

<span class="token keyword">const</span> app <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Hono</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

app<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">"/api/v1/status"</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">c</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> c<span class="token punctuation">.</span><span class="token function">json</span><span class="token punctuation">(</span><span class="token punctuation">{</span>
    engine<span class="token operator">:</span> <span class="token string">"Zerho"</span><span class="token punctuation">,</span>
    runtime<span class="token operator">:</span> <span class="token string">"Deno Edge"</span><span class="token punctuation">,</span>
    latencyMs<span class="token operator">:</span> <span class="token number">1.4</span><span class="token punctuation">,</span>
    status<span class="token operator">:</span> <span class="token string">"operational"</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">export</span> <span class="token keyword">default</span> app<span class="token punctuation">;</span></code></pre>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="home-features">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrap icon-cyan">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3 class="feature-title">${isEn ? "Deno 2 Native Engine" : "Motor Nativo Deno 2"}</h3>
            <p class="feature-desc">${
        isEn
          ? "Built in pure TypeScript with zero bloated node_modules. Millisecond boot times and zero friction."
          : "Construido en TypeScript puro sin node_modules gigantes. Tiempos de arranque en milisegundos y cero fricción."
      }</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap icon-violet">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            </div>
            <h3 class="feature-title">${
        isEn ? "Interactive Playground" : "Playground Interactivo"
      }</h3>
            <p class="feature-desc">${
        isEn
          ? "Run TypeScript and JavaScript code directly in the browser within docs without leaving the page."
          : "Ejecuta código TypeScript y JavaScript directamente en el navegador dentro de la documentación sin salir de la página."
      }</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap icon-emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h3 class="feature-title">${isEn ? "Deno Deploy Ready" : "Listo para Deno Deploy"}</h3>
            <p class="feature-desc">${
        isEn
          ? "Edge distribution across 35+ global regions with ETags, gzip/brotli compression and near-zero latency."
          : "Distribución en el Edge en más de 35 regiones mundiales con ETags, compresión gzip/brotli y latencia casi cero."
      }</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap icon-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 class="feature-title">${
        isEn ? "Instant Cmd+K Search" : "Búsqueda Instantánea Cmd+K"
      }</h3>
            <p class="feature-desc">${
        isEn
          ? "Ultra-fast client-side search index with keyboard navigation and context highlights without external dependencies."
          : "Índice de búsqueda client-side ultrarrápido con navegación por teclado y destacados de contexto sin dependencias externas."
      }</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap icon-pink">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
            </div>
            <h3 class="feature-title">${
        isEn ? "Markdown Superpowers" : "Superpoderes Markdown"
      }</h3>
            <p class="feature-desc">${
        isEn
          ? "VitePress-style callouts, automated Mermaid diagrams, file name tabs, and syntax highlighting."
          : "Callouts tipo VitePress, diagramas Mermaid automáticos, tabs con nombres de archivo y resaltado de sintaxis Shiki/Prism."
      }</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrap icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <h3 class="feature-title">${isEn ? "Pro-Grade Aesthetics" : "Estética Nivel Pro"}</h3>
            <p class="feature-desc">${
        isEn
          ? "Hyper-refined design inspired by Linear and Vercel, immersive dark mode, frosted glassmorphism, and fluid micro-animations."
          : "Diseño hiper-cuidado inspirado en Linear y Vercel, modo oscuro inmersivo, efectos de vidrio esmerilado y micro-animaciones fluidas."
      }</p>
          </div>
        </div>
      </section>
      `
      : `
      <!-- Documentation Body -->
      <article class="doc-container">
        <header class="doc-header">
          <div class="doc-meta-bar">
            <span class="reading-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${readingTimeMin} ${isEn ? "min read" : "min de lectura"}
            </span>
            ${
        editLinkUrl
          ? `
            <a href="${editLinkUrl}" target="_blank" rel="noopener noreferrer" class="doc-edit-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>${isEn ? "Edit on GitHub" : "Editar en GitHub"}</span>
            </a>`
          : ""
      }
          </div>
          ${frontmatter.title ? `<h1 class="page-title">${escapeHtml(frontmatter.title)}</h1>` : ""}
          ${
        frontmatter.description
          ? `<p class="page-subtitle">${escapeHtml(frontmatter.description)}</p>`
          : ""
      }
        </header>

        <div class="markdown-body">
          ${html}
        </div>

        <!-- Feedback Widget (Edge Deno KV) -->
        <div class="feedback-widget" id="feedbackWidget">
          <div class="feedback-text">${
        isEn ? "Was this page helpful?" : "¿Te ha resultado útil esta página?"
      }</div>
          <div class="feedback-buttons">
            <button class="feedback-btn" onclick="submitFeedback(true)" id="fbYes">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              <span>${isEn ? "Yes" : "Sí"}</span>
            </button>
            <button class="feedback-btn" onclick="submitFeedback(false)" id="fbNo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
              <span>No</span>
            </button>
          </div>
          <div class="feedback-msg" id="feedbackMsg" style="display:none;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${
        isEn
          ? "Thank you! Feedback saved in Deno KV."
          : "¡Gracias! Retroalimentación guardada en Deno KV."
      }</span>
          </div>
        </div>

        <!-- Doc Footer: Prev/Next -->
        <footer class="doc-footer">
          <div class="doc-nav-cards">
            ${
        frontmatter.prev
          ? `
            <a href="${frontmatter.prev.link}" class="doc-nav-card prev">
              <span class="nav-direction">${isEn ? "PREVIOUS" : "ANTERIOR"}</span>
              <span class="nav-title">← ${escapeHtml(frontmatter.prev.text)}</span>
            </a>`
          : `<div></div>`
      }
            ${
        frontmatter.next
          ? `
            <a href="${frontmatter.next.link}" class="doc-nav-card next">
              <span class="nav-direction">${isEn ? "NEXT" : "SIGUIENTE"}</span>
              <span class="nav-title">${escapeHtml(frontmatter.next.text)} →</span>
            </a>`
          : `<div></div>`
      }
          </div>
        </footer>
      </article>

      <!-- Table of Contents Right Bar -->
      <aside class="site-toc">
        ${tocHtml}
      </aside>
      `
  }
    </main>
  </div>

  <!-- Site Footer -->
  <footer class="site-footer">
    <div class="footer-inner">
      <p class="footer-msg">${escapeHtml(config.themeConfig.footer.message || "")}</p>
      <p class="footer-copy">${escapeHtml(config.themeConfig.footer.copyright || "")}</p>
    </div>
  </footer>

  <!-- Search Modal Overlay (Cmd+K) with Ask AI RAG -->
  <div class="search-modal-backdrop" id="searchModalBackdrop" style="display: none;">
    <div class="search-modal" role="dialog" aria-modal="true">
      <div class="search-tabs-bar">
        <button class="search-tab-btn active" id="searchTabQuick" onclick="switchSearchTab('quick')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>${isEn ? "Quick Search" : "Búsqueda Rápida"}</span>
        </button>
        <button class="search-tab-btn" id="searchTabAi" onclick="switchSearchTab('ai')">
          <span class="ai-tab-glow">✨</span>
          <span>${isEn ? "Ask AI" : "Preguntar a la IA"}</span>
          <span class="ai-tab-badge">RAG</span>
        </button>
      </div>

      <div class="search-input-wrap">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="searchInput" class="search-input" placeholder="${
    isEn ? "Search topics, functions or APIs..." : "Buscar temas, funciones o APIs..."
  }" autocomplete="off">
        <button class="search-action-btn" id="searchSubmitBtn" onclick="window.submitSearchOrAi && window.submitSearchOrAi()" title="Consultar">↵</button>
        <button class="search-close-btn" id="searchCloseBtn">ESC</button>
      </div>

      <!-- Quick Search Results List -->
      <div class="search-results-list" id="searchResultsList">
        <div class="search-empty">${
    isEn
      ? "Start typing to search documentation..."
      : "Comienza a escribir para buscar en toda la documentación..."
  }</div>
      </div>

      <!-- Ask AI Chat Response Box -->
      <div class="ai-chat-view" id="aiChatView" style="display: none;">
        <div class="ai-quick-prompts">
          <span class="ai-prompts-label">${
    isEn ? "Suggested Prompts:" : "Preguntas Frecuentes:"
  }</span>
          <div class="ai-prompt-chips">
            <button type="button" class="ai-chip" onclick="window.askAiPrompt && window.askAiPrompt('${
    isEn ? "How do I deploy to Deno Deploy?" : "¿Cómo desplegar en Deno Deploy?"
  }')">🚀 ${isEn ? "Deploy to Deno" : "Deploy en Deno"}</button>
            <button type="button" class="ai-chip" onclick="window.askAiPrompt && window.askAiPrompt('${
    isEn ? "How does the Live Playground work?" : "¿Cómo funciona el Playground?"
  }')">⚡ ${isEn ? "Live Playground" : "Playground Interactivo"}</button>
            <button type="button" class="ai-chip" onclick="window.askAiPrompt && window.askAiPrompt('${
    isEn ? "What is llms.txt standard?" : "¿Qué es llms.txt para IA?"
  }')">🤖 ${isEn ? "LLMs.txt Support" : "Soporte LLMs.txt"}</button>
          </div>
        </div>
        <div class="ai-response-card" id="aiResponseCard">
          <div class="ai-card-header">
            <span class="ai-avatar">⚡</span>
            <span class="ai-bot-name">Zerho Edge AI</span>
            <span class="ai-status-pill" id="aiStatusPill">Listo</span>
          </div>
          <div class="ai-content-body" id="aiContentBody">
            ${
    isEn
      ? "Ask any question in natural language above and press <kbd>Enter</kbd> to synthesize an answer from the official documentation."
      : "Escribe tu consulta en lenguaje natural arriba y presiona <kbd>Enter</kbd> para que la IA sintetice una respuesta basada en la documentación oficial."
  }
          </div>
          <div class="ai-sources-wrap" id="aiSourcesWrap" style="display:none;">
            <div class="ai-sources-title">${
    isEn ? "Sources & Citations:" : "Fuentes y Citas:"
  }</div>
            <div class="ai-sources-list" id="aiSourcesList"></div>
          </div>
        </div>
      </div>

      <div class="search-footer-hint">
        <span><kbd>↑</kbd> <kbd>↓</kbd> ${isEn ? "Navigate" : "Navegar"}</span>
        <span><kbd>↵</kbd> ${isEn ? "Select / Ask" : "Consultar"}</span>
        <span><kbd>ESC</kbd> ${isEn ? "Close" : "Cerrar"}</span>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="/assets/app.js?v=${VERSION}"></script>
  <script src="/assets/playground.js?v=${VERSION}"></script>
  <script type="module" src="/assets/openapi-client.js?v=${VERSION}"></script>
  <!-- Mermaid.js for diagrams -->
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({
      startOnLoad: true,
      theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark',
      themeVariables: {
        primaryColor: '#8b5cf6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#a78bfa',
        lineColor: '#06b6d4',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a'
      }
    });
  </script>
</body>
</html>`;
}
