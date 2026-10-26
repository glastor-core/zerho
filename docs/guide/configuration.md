---
title: Configuración del Sitio
description: Cómo personalizar la navegación, barras laterales, temas y metadatos en ZerhoPress.
prev:
  text: Comenzando con ZerhoPress
  link: /guide/getting-started
next:
  text: Superpoderes Markdown
  link: /guide/markdown-features
---

## Archivo `zerho.config.ts`

Toda la personalización del sitio se define mediante un archivo TypeScript tipado en la raíz del proyecto llamado `zerho.config.ts`.

Al usar TypeScript nativo en Deno, cuentas con autocompletado inteligente y validación estricta de tipos sin necesidad de herramientas externas.

```ts [zerho.config.ts]
import { ZerhoConfig } from "./src/core/types.ts";

export const config: ZerhoConfig = {
  title: "Mi Documentación",
  tagline: "Construida con ZerhoPress en Deno",
  description: "Documentación técnica moderna con soporte Edge",
  lang: "es",

  themeConfig: {
    siteTitle: "Mi Doc",
    nav: [
      { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/api/runtime", activeMatch: "/api/" }
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Primeros Pasos",
          items: [
            { text: "Introducción", link: "/guide/getting-started" },
            { text: "Configuración", link: "/guide/configuration" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/tu-usuario/tu-repo" }
    ],
    footer: {
      message: "Publicado bajo licencia MIT.",
      copyright: "Copyright © 2026."
    }
  }
};

export default config;
```

---

## Opciones de Navegación Superior (`nav`)

La propiedad `nav` acepta una lista de enlaces para la barra superior. Puedes agregar insignias visuales (`badge`) para destacar páginas clave como nuevas o en versión beta:

```ts
nav: [
  { text: "Guía", link: "/guide/getting-started", activeMatch: "/guide/" },
  { text: "Playground", link: "/playground/", badge: "PRO" },
  { text: "Changelog", link: "/changelog", badge: "v2.0" }
]
```

---

## Configuración de Barra Lateral (`sidebar`)

ZerhoPress permite definir barras laterales específicas por ruta o una estructura global unificada:

```ts
sidebar: {
  "/guide/": [
    {
      text: "Fundamentos",
      items: [
        { text: "¿Qué es ZerhoPress?", link: "/guide/getting-started" },
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

::: tip ACTIVACIÓN AUTOMÁTICA
El sidebar detecta automáticamente la ruta actual y aplica la clase activa con un sutil resplandor violeta en el enlace correspondiente.
:::

---

## Enlace "Editar en GitHub"

Si deseas permitir que los lectores colaboren corrigiendo o ampliando la documentación, activa la opción `editLink`:

```ts
editLink: {
  pattern: "https://github.com/glastor-core/zerhopress/edit/main/docs/:path",
  text: "Editar esta página en GitHub"
}
```

Esto generará automáticamente un enlace directo con icono al archivo `.md` específico en GitHub al principio de cada documento.
