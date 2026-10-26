export interface NavItem {
  text: string;
  link: string;
  activeMatch?: string;
  badge?: string;
}

export interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
  badge?: string;
}

export interface LocaleConfig {
  label: string;
  lang: string;
  link?: string;
  title?: string;
  tagline?: string;
  description?: string;
  nav?: NavItem[];
  sidebar?: Record<string, SidebarItem[]> | SidebarItem[];
}

export interface ApiDocsConfig {
  entrypoints: string[];
  route?: string;
  title?: string;
}

export interface ZerhoConfig {
  title: string;
  tagline: string;
  description: string;
  lang: string;
  base?: string;
  head?: [string, Record<string, string>][];
  apiDocs?: ApiDocsConfig;
  locales?: Record<string, LocaleConfig>;
  themeConfig: {
    logo?: string;
    siteTitle?: string;
    nav: NavItem[];
    sidebar: Record<string, SidebarItem[]> | SidebarItem[];
    socialLinks: { icon: "github" | "twitter" | "discord"; link: string }[];
    footer: {
      message?: string;
      copyright?: string;
    };
    editLink?: {
      pattern: string;
      text: string;
    };
    search?: {
      placeholder?: string;
    };
  };
}

export const config: ZerhoConfig = {
  title: "Zerho",
  tagline: "El motor de documentación de nivel pro diseñado nativamente para Deno & Deno Deploy",
  description:
    "SSG ultrarrápido, playground interactivo en vivo, búsqueda instantánea Cmd+K y estética de clase mundial.",
  lang: "es",
  apiDocs: {
    entrypoints: ["./src/core/builder.ts", "./src/core/markdown.ts", "./src/core/search.ts"],
    route: "/reference",
    title: "Referencia de API (Deno Doc)",
  },
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
      tagline: "Pro-grade documentation engine built natively for Deno 2 and Deno Deploy",
      description:
        "Ultra-fast SSG, live interactive playground, instant Cmd+K search and world-class aesthetics.",
      nav: [
        { text: "Guide", link: "/en/guide/getting-started", activeMatch: "/en/guide/" },
        {
          text: "Features",
          link: "/en/guide/markdown-features",
          activeMatch: "/en/guide/markdown-features",
        },
        { text: "API Reference", link: "/reference", activeMatch: "/reference", badge: "Auto" },
        { text: "Playground", link: "/playground/", activeMatch: "/playground/", badge: "Monaco" },
        { text: "OpenAPI", link: "/api/openapi", activeMatch: "/api/openapi", badge: "Live" },
      ],
      sidebar: {
        "/en/guide/": [
          {
            text: "Introduction",
            items: [
              { text: "What is Zerho?", link: "/en/guide/getting-started" },
              { text: "Markdown Superpowers", link: "/en/guide/markdown-features" },
            ],
          },
        ],
      },
    },
  },
  themeConfig: {
    siteTitle: "Zerho",
    nav: [
      { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
      {
        text: "Características",
        link: "/guide/markdown-features",
        activeMatch: "/guide/markdown-features",
      },
      { text: "Referencia API", link: "/reference", activeMatch: "/reference", badge: "Auto" },
      { text: "Playground TS", link: "/playground/", activeMatch: "/playground/", badge: "Monaco" },
      {
        text: "OpenAPI Explorer",
        link: "/api/openapi",
        activeMatch: "/api/openapi",
        badge: "Live",
      },
      { text: "API Deno", link: "/api/runtime", activeMatch: "/api/runtime" },
      { text: "Deploy", link: "/guide/deployment", activeMatch: "/guide/deployment" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introducción",
          items: [
            { text: "¿Qué es Zerho?", link: "/guide/getting-started" },
            { text: "Configuración", link: "/guide/configuration" },
            { text: "Deploy en Deno", link: "/guide/deployment", badge: "Edge" },
          ],
        },
        {
          text: "Contenido y Sintaxis",
          items: [
            { text: "Superpoderes Markdown", link: "/guide/markdown-features" },
            { text: "Playground Interactivo", link: "/playground/", badge: "PRO" },
          ],
        },
      ],
      "/api/": [
        {
          text: "Referencia y Exploradores",
          items: [
            { text: "OpenAPI Explorer Interactivo", link: "/api/openapi", badge: "Try It" },
            { text: "Deno Core APIs", link: "/api/runtime" },
          ],
        },
      ],
      "/playground/": [
        {
          text: "Entorno Interactivo",
          items: [
            { text: "Deno Playground en Vivo", link: "/playground/" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/glastor-core/zerho" },
    ],
    footer: {
      message: "Publicado bajo licencia MIT. Impulsado por Deno 2.x & Cloudflare.",
      copyright: "Copyright © 2026 Zerho — GLASTOR®. Todos los derechos reservados.",
    },
    editLink: {
      pattern: "https://github.com/glastor-core/zerho/edit/main/docs/:path",
      text: "Editar esta página en GitHub",
    },
    search: {
      placeholder: "Buscar documentación (Cmd + K)...",
    },
  },
};

export default config;
