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

export interface ZerhoConfig {
  title: string;
  tagline: string;
  description: string;
  lang: string;
  base?: string;
  head?: [string, Record<string, string>][];
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
  title: "ZerhoPress",
  tagline: "El motor de documentación de nivel pro diseñado nativamente para Deno & Deno Deploy",
  description: "SSG ultrarrápido, playground interactivo en vivo, búsqueda instantánea Cmd+K y estética de clase mundial.",
  lang: "es",
  themeConfig: {
    siteTitle: "ZerhoPress",
    nav: [
      { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "Características", link: "/guide/markdown-features", activeMatch: "/guide/markdown-features" },
      { text: "Playground TS", link: "/playground/", activeMatch: "/playground/", badge: "Monaco" },
      { text: "OpenAPI Explorer", link: "/api/openapi", activeMatch: "/api/openapi", badge: "Live" },
      { text: "API Deno", link: "/api/runtime", activeMatch: "/api/runtime" },
      { text: "Deploy", link: "/guide/deployment", activeMatch: "/guide/deployment" }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introducción",
          items: [
            { text: "¿Qué es ZerhoPress?", link: "/guide/getting-started" },
            { text: "Configuración", link: "/guide/configuration" },
            { text: "Deploy en Deno", link: "/guide/deployment", badge: "Edge" }
          ]
        },
        {
          text: "Contenido y Sintaxis",
          items: [
            { text: "Superpoderes Markdown", link: "/guide/markdown-features" },
            { text: "Playground Interactivo", link: "/playground/", badge: "PRO" }
          ]
        }
      ],
      "/api/": [
        {
          text: "Referencia y Exploradores",
          items: [
            { text: "OpenAPI Explorer Interactivo", link: "/api/openapi", badge: "Try It" },
            { text: "Deno Core APIs", link: "/api/runtime" }
          ]
        }
      ],
      "/playground/": [
        {
          text: "Entorno Interactivo",
          items: [
            { text: "Deno Playground en Vivo", link: "/playground/" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/glastor-core/zerhopress" }
    ],
    footer: {
      message: "Publicado bajo licencia MIT. Impulsado por Deno 2.x & Deno Deploy.",
      copyright: "Copyright © 2026 ZerhoPress. Todos los derechos reservados."
    },
    editLink: {
      pattern: "https://github.com/glastor-core/zerhopress/edit/main/docs/:path",
      text: "Editar esta página en GitHub"
    },
    search: {
      placeholder: "Buscar documentación (Cmd + K)..."
    }
  }
};

export default config;
