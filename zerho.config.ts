/**
 * @module config
 * Configuration definitions, schema types and default options for the Zerho documentation engine.
 *
 * @example
 * ```ts
 * import { type ZerhoConfig, config } from "@glastor/zerho/config";
 * ```
 */

/** Top navigation bar link item */
export interface NavItem {
  /** Display label for the navigation item */
  text: string;
  /** Target URL link or route path */
  link: string;
  /** Active regex or route pattern match */
  activeMatch?: string;
  /** Optional badge text displayed next to label */
  badge?: string;
}

/** Sidebar menu navigation tree item */
export interface SidebarItem {
  /** Display title for the sidebar entry */
  text: string;
  /** Optional target URL link or document path */
  link?: string;
  /** Nested child sidebar items for subdirectories */
  items?: SidebarItem[];
  /** Whether the section starts in collapsed state */
  collapsed?: boolean;
  /** Optional status or version badge */
  badge?: string;
}

/** Version selector dropdown item */
export interface VersionItem {
  /** Version display label (e.g. 'v1.0') */
  label: string;
  /** Link to target version documentation */
  link: string;
}

/** Call-to-action button configuration */
export interface CtaButtonConfig {
  /** Button display label */
  text: string;
  /** Button target URL */
  link: string;
}

/** Multi-language locale configuration */
export interface LocaleConfig {
  /** Locale display label */
  label: string;
  /** Language ISO code (e.g. 'en', 'es') */
  lang: string;
  /** Base root route link for this locale */
  link?: string;
  /** Overridden site title for this locale */
  title?: string;
  /** Overridden tagline for this locale */
  tagline?: string;
  /** Overridden description for this locale */
  description?: string;
  /** Custom navigation bar for this locale */
  nav?: NavItem[];
  /** Custom sidebar tree for this locale */
  sidebar?: Record<string, SidebarItem[]> | SidebarItem[] | "auto";
}

/** API documentation generator options */
export interface ApiDocsConfig {
  /** TypeScript/Deno source entrypoints to document */
  entrypoints: string[];
  /** Base web route path for API docs */
  route?: string;
  /** Page header title */
  title?: string;
  /** Strict verification mode */
  strict?: boolean;
  /** Base repository URL for linking symbols directly to source code lines */
  repoUrl?: string;
}

/** Brand theme colors configuration */
export interface ThemeColorsConfig {
  /** Primary brand accent hex/rgb color */
  primary?: string;
  /** Secondary brand accent hex/rgb color */
  secondary?: string;
  /** Background surface hex/rgb color */
  bgPrimary?: string;
}

/** Extensible build lifecycle plugin definition */
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

/** Complete Zerho site configuration specification */
export interface ZerhoConfig {
  /** Site name and title */
  title: string;
  /** Hero subtitle / tagline */
  tagline: string;
  /** Meta description for SEO */
  description: string;
  /** Default language code */
  lang: string;
  /** Canonical production site base URL */
  siteUrl?: string;
  /** Base path prefix */
  base?: string;
  /** Extra HTML head elements */
  head?: [string, Record<string, string>][];
  /** Automated API reference docs options */
  apiDocs?: ApiDocsConfig;
  /** Internationalization locales */
  locales?: Record<string, LocaleConfig>;
  /** Fail compilation if broken internal links are detected */
  strictLinks?: boolean;
  /** Extensible lifecycle plugins */
  plugins?: ZerhoPlugin[];
  /** Visual presentation and navigation theme configuration */
  themeConfig: {
    logo?: string;
    siteTitle?: string;
    colors?: ThemeColorsConfig;
    versionBadge?: string;
    versions?: VersionItem[];
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

/**
 * Type-safe configuration helper function for Zerho.
 * @param userConfig User site configuration options.
 * @returns The validated configuration object.
 */
export function defineConfig(userConfig: ZerhoConfig): ZerhoConfig {
  return userConfig;
}

/** Default Zerho configuration instance */
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
