---
title: Site Configuration
description: How to customize navigation, sidebars, themes, and metadata in Zerho.
prev:
  text: Getting Started with Zerho
  link: /en/guide/getting-started
next:
  text: Markdown Superpowers
  link: /en/guide/markdown-features
---

# Site Configuration

Zerho is fully customizable through a typed TypeScript file at your project root: `zerho.config.ts`.

With native Deno TypeScript support, you enjoy instant autocomplete, strict type validation, and
zero extra bundler overhead.

---

## The `zerho.config.ts` File

Here is an annotated overview of the configuration schema:

```ts [zerho.config.ts]
import { ZerhoConfig } from "./src/core/types.ts";

export const config: ZerhoConfig = {
  title: "My Documentation",
  tagline: "Built with Zerho on Deno 2",
  description: "Modern technical documentation with Edge AI and live sandbox",
  lang: "en",

  themeConfig: {
    siteTitle: "My Docs",
    nav: [
      { text: "Guide", link: "/en/guide/getting-started", activeMatch: "/en/guide/" },
      { text: "Playground", link: "/playground/", badge: "Monaco" },
      { text: "API", link: "/reference", activeMatch: "/reference" },
    ],
    sidebar: {
      "/en/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/en/guide/getting-started" },
            { text: "Configuration", link: "/en/guide/configuration" },
            { text: "Deployment", link: "/en/guide/deployment", badge: "Edge" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/glastor-core/zerho" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Zerho — GLASTOR®. All rights reserved.",
    },
  },
};

export default config;
```

---

## Top Navigation (`nav`)

The `nav` property configures the top navbar links. You can attach visual badges (`badge`) to
spotlight new features:

```ts
nav: [
  { text: "Guide", link: "/en/guide/getting-started", activeMatch: "/en/guide/" },
  { text: "Playground", link: "/playground/", badge: "PRO" },
  { text: "Changelog", link: "/changelog", badge: "v1.6" },
];
```

---

## Sidebar Structure (`sidebar`)

Zerho allows prefix-based or global sidebars. Sidebars match the longest path prefix automatically:

```ts
sidebar: {
  "/en/guide/": [
    {
      text: "Fundamentals",
      items: [
        { text: "What is Zerho?", link: "/en/guide/getting-started" },
        { text: "Configuration", link: "/en/guide/configuration" },
      ],
    },
    {
      text: "Content & Syntax",
      items: [
        { text: "Markdown Superpowers", link: "/en/guide/markdown-features" },
        { text: "Edge Deployment", link: "/en/guide/deployment", badge: "Cloud" },
      ],
    },
  ],
}
```

---

## Internationalization (`locales`)

Zerho features native, declarative multi-language support. Define locales in `locales` to configure
language-specific titles, navigation bars, and sidebars:

```ts
locales: {
  root: {
    label: "Español",
    lang: "es",
  },
  en: {
    label: "English",
    lang: "en",
    link: "/en/",
    title: "Zerho",
    tagline: "Pro-grade documentation engine built natively for Deno 2",
    nav: [...],
    sidebar: {...},
  },
}
```
