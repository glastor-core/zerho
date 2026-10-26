# ⚡ Zerho

<p align="center">
  <strong>El motor de documentación técnica de nivel pro diseñado nativamente para Deno 2 y Deno Deploy.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Deno-2.x-000000?style=for-the-badge&logo=deno&logoColor=white" alt="Deno 2" />
  <img src="https://img.shields.io/badge/Deno_Deploy-Live-06b6d4?style=for-the-badge&logo=deno&logoColor=white" alt="Deno Deploy" />
  <img src="https://img.shields.io/badge/CI-Passing-10b981?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI Status" />
  <img src="https://img.shields.io/badge/JSR-@zerho/core-facc15?style=for-the-badge&logo=jsr&logoColor=black" alt="JSR Package" />
  <img src="https://img.shields.io/badge/LLMs.txt-Supported-8b5cf6?style=for-the-badge" alt="LLMs.txt Supported" />
  <a href="https://github.com/glastor-core/nemesis"><img src="https://img.shields.io/badge/Security-Nemesis_Audit-purple?style=for-the-badge" alt="Nemesis Security Audit" /></a>
  <img src="https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

<p align="center">
  <a href="https://zerho.glastor-dev.deno.net/"><strong>Explorar Documentación en Vivo &rarr;</strong></a> |
  <a href="https://zerho.xyz/llms.txt"><strong>Contexto LLMs.txt &rarr;</strong></a>
</p>

---

## 🚀 ¿Por qué Zerho supera a VitePress y herramientas tradicionales?

| Característica             |         VitePress / Docusaurus          |                   Zerho Pro en Deno 2                   |
| :------------------------- | :-------------------------------------: | :-----------------------------------------------------: |
| **Runtime Base**           | Node.js + npm + `node_modules` (400MB+) |           **Deno 2 Nativo (0 node_modules)**            |
| **Playground en Vivo**     |      ❌ Requiere plugins externos       |       **✅ Sandbox TypeScript / Deno Integrado**        |
| **Bloques Ejecutables**    |         Solo estáticos con copy         |      **✅ `ts run` con salida de consola en vivo**      |
| **Soporte IA (LLMs.txt)**  |        ❌ No disponible de serie        |      **✅ `/llms.txt` y `/llms-full.txt` nativos**      |
| **Auto-Docs desde Código** |       Requiere TypeDoc / plugins        |       **✅ `deno doc --json` integrado de serie**       |
| **Code-Groups Políglotas** |          Requiere bundler Node          |     **✅ Sincronización global con `localStorage`**     |
| **Telemetría e Insights**  |        Cookies de terceros (GA4)        | **✅ Edge Deno KV (queries y preguntas sin responder)** |
| **Internacionalización**   |         Configuración compleja          |   **✅ i18n declarativo (`/en/`, `/es/`) en header**    |
| **Despliegue Edge**        |    Configuración manual de adapters     |        **✅ 1 Clic en Deno Deploy (`main.ts`)**         |
| **Búsqueda Instantánea**   |     Algolia externo o local básico      |        **✅ Buscador Cmd+K spotlight indexado**         |
| **Diagramas Mermaid**      |              Plugin extra               |             **✅ Soporte nativo de serie**              |
| **Tiempo de Compilación**  |              ~2.5 segundos              |            **~90 milisegundos (11 páginas)**            |
| **Estética UI**            |          Tema default clásico           |      **Estilo Linear / Vercel con Glassmorphism**       |

---

## ⚡ Inicio Rápido

Solo necesitas tener instalado [Deno 2](https://deno.com).

```bash
# 1. Iniciar el servidor local de desarrollo con Live-Reload (WebSocket HMR)
deno task dev

# 2. Compilar el sitio estático para producción (genera dist/ con sitemap y llms.txt)
deno task build

# 3. Servir en modo producción con encabezados de seguridad Edge y Deno KV
deno task serve
```

---

## 🛠️ Estructura del Proyecto

```text
zerho/
├── deno.json               # Configuración oficial de Deno 2, JSR y tareas
├── zerho.config.ts         # Metadatos, i18n, navegación, sidebar y apiDocs
├── main.ts                 # Servidor Edge perimetral con Deno KV y cabeceras AppSec
├── docs/                   # Contenido en Markdown
│   ├── index.md            # Landing page principal (layout: home)
│   ├── reference.md        # Referencia de API auto-generada con deno doc
│   ├── guide/              # Guías en español (getting-started, configuration, etc.)
│   ├── en/                 # Documentación internacionalizada en inglés
│   ├── playground/         # Entorno de pruebas TypeScript interactivo
│   └── api/                # Referencia de APIs del runtime y OpenAPI
├── src/
│   ├── core/
│   │   ├── docgen.ts       # Generador de referencias de API analizando AST de Deno Doc
│   │   ├── builder.ts      # Generador SSG ultrarrápido con sitemap, robots y llms.txt
│   │   ├── markdown.ts     # Compilador Markdown con ::: code-group y callouts
│   │   ├── dev.ts          # Servidor dev con WebSocket HMR
│   │   └── search.ts       # Indexador de búsqueda client-side
│   ├── client/
│   │   ├── theme.css       # Estilos Pro (Glassmorphism, Dark/Light, i18n, Neon Glow)
│   │   ├── app.js          # Controlador cliente (Theme, ScrollSpy, Cmd+K, Tabs Sync)
│   │   └── playground.js   # Motor de ejecución en Web Worker simulando Deno
│   └── templates/
│       └── layout.ts       # Plantilla HTML con SEO, OpenGraph y alternativos para LLMs
└── dist/                   # Salida estática compilada lista para producción
```

---

## 🌐 Despliegue en Deno Deploy

### Opción 1: Conexión Automática con GitHub (Recomendado)

1. Conecta tu repositorio en [dash.deno.com](https://dash.deno.com).
2. Selecciona `main.ts` como entrypoint y `deno task build` como paso de compilación.
3. ¡Listo! Cada `git push` despliega en más de 35 regiones mundiales con latencia inferior a 10ms.

### Opción 2: Despliegue directo por CLI

```bash
deno run -A jsr:@deno/deployctl deploy --project=zerho main.ts
```

---

## 🛡️ Gobernanza, Seguridad y Comunidad

Este proyecto se adhiere a los más altos estándares de calidad y gobernanza de código abierto de
GitHub:

- **[Política de Seguridad (.github/SECURITY.md)](.github/SECURITY.md)**: Protocolo de divulgación
  coordinada de vulnerabilidades.
- **[Guía de Contribución (.github/CONTRIBUTING.md)](.github/CONTRIBUTING.md)**: Flujo de trabajo,
  convenciones de commit y suite de verificación.
- **[Código de Conducta (.github/CODE_OF_CONDUCT.md)](.github/CODE_OF_CONDUCT.md)**: Estándar
  Contributor Covenant v2.1.
- **[Registro de Cambios (CHANGELOG.md)](CHANGELOG.md)**: Basado en el estándar Keep a Changelog y
  SemVer.
- **[Cita Académica (CITATION.cff)](CITATION.cff)**: Metadatos para citación formal de software.
- **[Colaboradores (CONTRIBUTORS.md)](CONTRIBUTORS.md)**: Equipo y reconocimientos.

---

## 📄 Licencia

[MIT License](LICENSE) © 2026 GLASTOR® / Zerho.
