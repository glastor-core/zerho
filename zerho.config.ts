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

export interface VersionItem {
  label: string;
  link: string;
}

export interface CtaButtonConfig {
  text: string;
  link: string;
}

export interface LocaleConfig {
  label: string;
  lang: string;
  link?: string;
  title?: string;
  tagline?: string;
  description?: string;
  nav?: NavItem[];
  sidebar?: Record<string, SidebarItem[]> | SidebarItem[] | "auto";
}

export interface ApiDocsConfig {
  entrypoints: string[];
  route?: string;
  title?: string;
  strict?: boolean;
  /** Base repository URL for linking symbols directly to source code lines (e.g. https://github.com/org/repo/blob/main) */
  repoUrl?: string;
}

export interface ThemeColorsConfig {
  /** Primary brand accent hex/rgb color (overrides --brand-primary) */
  primary?: string;
  /** Secondary brand accent hex/rgb color (overrides --brand-secondary) */
  secondary?: string;
  /** Background surface hex/rgb color (overrides --bg-primary) */
  bgPrimary?: string;
}

export interface ZerhoPlugin {
  /** Unique plugin identifier */
  name: string;
  /** Hook executed before site compilation starts */
  onBeforeBuild?: (config: ZerhoConfig) => Promise<void> | void;
  /** Hook to transform raw Markdown content before parsing */
  transformMarkdown?: (markdown: string, routePath: string) => Promise<string> | string;
  /** Hook to transform compiled HTML output before writing to disk */
  transformHtml?: (html: string, routePath: string) => Promise<string> | string;
  /** Hook executed after all static assets and indices have been written */
  onAfterBuild?: (context: { outDir: string; routes: string[] }) => Promise<void> | void;
}

export interface ZerhoConfig {
  title: string;
  tagline: string;
  description: string;
  lang: string;
  siteUrl?: string;
  base?: string;
  head?: [string, Record<string, string>][];
  apiDocs?: ApiDocsConfig;
  locales?: Record<string, LocaleConfig>;
  /** Fail compilation if broken internal links or missing heading anchors are detected */
  strictLinks?: boolean;
  /** Extensible lifecycle plugins */
  plugins?: ZerhoPlugin[];
  themeConfig: {
    logo?: string;
    siteTitle?: string;
    /** Custom brand color palette tokens injected without editing CSS */
    colors?: ThemeColorsConfig;
    /** Optional badge displayed next to brand logo (e.g. 'v2.0' or 'Deno 2.x'). Set to '' to hide. */
    versionBadge?: string;
    /** Multi-version documentation dropdown items */
    versions?: VersionItem[];
    /** Custom header Call-To-Action button, or false to hide */
    ctaButton?: CtaButtonConfig | false;
    nav: NavItem[];
    sidebar: Record<string, SidebarItem[]> | SidebarItem[] | "auto";
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
  siteUrl: "https://zerho.xyz",
  apiDocs: {
    entrypoints: ["./src/core/builder.ts", "./src/core/markdown.ts", "./src/core/search.ts"],
    route: "/reference",
    title: "Referencia de API (Deno Doc)",
    strict: true,
    repoUrl: "https://github.com/glastor-core/zerho/blob/main",
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
              { text: "Configuration", link: "/en/guide/configuration" },
              { text: "Deploy on Deno", link: "/en/guide/deployment", badge: "Edge" },
            ],
          },
          {
            text: "Content & Syntax",
            items: [
              { text: "Markdown Superpowers", link: "/en/guide/markdown-features" },
              { text: "Interactive Playground", link: "/playground/", badge: "PRO" },
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
      { text: "Referencia", link: "/reference", activeMatch: "/reference", badge: "Auto" },
      { text: "Playground", link: "/playground/", activeMatch: "/playground/", badge: "Monaco" },
      {
        text: "OpenAPI",
        link: "/api/openapi",
        activeMatch: "/api/openapi",
        badge: "Live",
      },
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
