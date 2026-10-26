---
title: Configuración del Sitio
description: Cómo personalizar la navegación, barras laterales, temas y metadatos en Zerho.
prev:
  text: Comenzando con Zerho
  link: /guide/getting-started
next:
  text: Superpoderes Markdown
  link: /guide/markdown-features
---

## Archivo `zerho.config.ts`

Toda la personalización del sitio se define mediante un archivo TypeScript tipado en la raíz del
proyecto llamado `zerho.config.ts`.

Al usar TypeScript nativo en Deno, cuentas con autocompletado inteligente y validación estricta de
tipos sin necesidad de herramientas externas.

```ts [zerho.config.ts]
import { ZerhoConfig } from "./src/core/types.ts";

export const config: ZerhoConfig = {
  title: "Mi Documentación",
  tagline: "Construida con Zerho en Deno",
  description: "Documentación técnica moderna con soporte Edge",
  lang: "es",

  themeConfig: {
    siteTitle: "Mi Doc",
    nav: [
      { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/api/runtime", activeMatch: "/api/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Primeros Pasos",
          items: [
            { text: "Introducción", link: "/guide/getting-started" },
            { text: "Configuración", link: "/guide/configuration" },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/tu-usuario/tu-repo" },
    ],
    footer: {
      message: "Publicado bajo licencia MIT.",
      copyright: "Copyright © 2026.",
    },
  },
};

export default config;
```

---

## Opciones de Navegación Superior (`nav`)

La propiedad `nav` acepta una lista de enlaces para la barra superior. Puedes agregar insignias
visuales (`badge`) para destacar páginas clave como nuevas o en versión beta:

```ts
nav: [
  { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
  { text: "Playground", link: "/playground/", badge: "PRO" },
  { text: "Changelog", link: "/changelog", badge: "v2.0" },
];
```

---

## Configuración de Barra Lateral (`sidebar`)

Zerho permite definir barras laterales específicas por ruta o una estructura global unificada:

```ts
sidebar: {
  "/guide/": [
    {
      text: "Fundamentos",
      items: [
        { text: "¿Qué es Zerho?", link: "/guide/getting-started" },
        { text: "Configuración", link: "/guide/configuration" }
      ]
    },
    {
      text: "Avanzado",
      items: [
        { text: "Superpoderes Markdown", link: "/guide/markdown-features" },
        { text: "Despliegue Edge", link: "/guide/deployment", badge: "Cloud" }
      ]
    }
  ]
}
```

::: tip ACTIVACIÓN AUTOMÁTICA El sidebar detecta automáticamente la ruta actual y aplica la clase
activa con un sutil resplandor violeta en el enlace correspondiente. :::

---

## Enlace "Editar en GitHub"

Si deseas permitir que los lectores colaboren corrigiendo o ampliando la documentación, activa la
opción `editLink`:

```ts
editLink: {
  pattern: "https://github.com/glastor-core/zerho/edit/main/docs/:path",
  text: "Editar esta página en GitHub"
}
```

Esto generará automáticamente un enlace directo con icono al archivo `.md` específico en GitHub al
principio de cada documento.

---

## Auto-Documentación de Código (`apiDocs`)

Zerho incorpora un motor nativo de introspección que analiza tus archivos TypeScript fuente mediante
`deno doc --json` y genera automáticamente una página completa de referencia en Markdown:

```ts [zerho.config.ts]
apiDocs: {
  entrypoints: [
    "./src/core/builder.ts",
    "./src/core/markdown.ts",
    "./src/core/search.ts"
  ],
  route: "/reference",
  title: "Referencia de API (Deno Doc)",
}
```

- **Firmas Tipadas**: Extrae automáticamente tipos de retorno, modificadores de visibilidad,
  propiedades opcionales y valores por defecto.
- **JSDoc Parsing**: Convierte etiquetas `@param` y `@returns` en tablas GFM legibles y
  estandarizadas.
- **Cero Build Steps Externos**: Se ejecuta directamente con el comando `deno task build`.

---

## Internacionalización Multilingüe (`locales`)

Configura soporte i18n declarando prefijos de ruta con sus respectivas traducciones de navegación,
barra lateral y metadatos:

```ts [zerho.config.ts]
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
    nav: [
      { text: "Guide", link: "/en/guide/getting-started" },
      { text: "Reference", link: "/reference" }
    ],
    sidebar: {
      "/en/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/en/guide/getting-started" },
            { text: "Features", link: "/en/guide/markdown-features" }
          ]
        }
      ]
    }
  }
}
```

El selector de idioma en la barra de navegación permite a los usuarios alternar fluidamente entre
versiones preservando el estado de la aplicación.

---

## Soporte para Agentes de IA (`llms.txt`)

Durante la compilación, Zerho genera automáticamente dos archivos estándar en la raíz de tu sitio:

1. **`/llms.txt`**: Manifiesto estructurado según la especificación de
   [llmstxt.org](https://llmstxt.org) que lista todas las páginas indexadas con títulos y
   descripciones concisas.
2. **`/llms-full.txt`**: Documentación técnica consolidada en un único archivo Markdown limpio (sin
   HTML boilerplate), ideal para ingestión en agentes y LLMs con ventanas de contexto extendidas.
