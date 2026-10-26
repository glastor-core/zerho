---
title: Getting Started with Zerho
description: Quick start guide to create and deploy technical documentation in Deno.
layout: doc
prev:
  text: Home
  link: /
next:
  text: Markdown Superpowers
  link: /en/guide/markdown-features
---

# Getting Started with Zerho

**Zerho** is a pro-grade static documentation engine built natively for **Deno 2** and optimized for
instant global edge deployment on **Deno Deploy**.

Inspired by the ergonomics of modern documentation systems, Zerho eliminates legacy Node.js
toolchains:

1. **Pure Deno 2 Runtime**: Zero `node_modules`, zero npm baggage.
2. **Integrated Interactive Playground**: Execute TypeScript/JavaScript directly within
   documentation pages.
3. **Instant Cmd+K Search**: Client-side full-text index built during SSG.
4. **Synchronized Polyglot Code-Groups**: Automatic tab switching with `localStorage` memory across
   the entire site.
5. **Native Mermaid Diagrams & OpenAPI Explorer**: Diagramming and interactive REST explorer out of
   the box.

---

## Quick Start

To launch a Zerho project on your machine, you only need [Deno](https://deno.com) installed:

::: code-group

```bash [Deno]
# 1. Start development server with Live-Reload
deno task dev

# 2. Build static production bundle
deno task build

# 3. Preview production server with Edge Deno KV
deno task serve
```

```bash [npm]
# Install and run via JSR
npx jsr add @zerho/zerho
```

```bash [pnpm]
# Install and run via pnpm and JSR
pnpm dlx jsr add @zerho/zerho
```

```bash [bun]
# Install and run via Bun and JSR
bunx jsr add @zerho/zerho
```

:::

::: tip LIVE RELOAD (HMR) The `deno task dev` command starts a WebSocket file watcher that instantly
reloads your browser whenever Markdown or config files change. :::

---

## Interactive Live Demo

Try the interactive Deno sandbox below. Click **Ejecutar en Deno** to execute the TypeScript
snippet:

```ts run [runtime-check.ts]
interface RuntimeInfo {
  engine: string;
  version: string;
  features: string[];
}

const info: RuntimeInfo = {
  engine: "Zerho Edge",
  version: Deno.version.deno,
  features: ["Web Workers", "WebCrypto", "Edge KV", "Native LLM Context"],
};

console.log("⚡ Zerho runtime successfully initialized:");
console.log(JSON.stringify(info, null, 2));
```
