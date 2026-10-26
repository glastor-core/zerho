# Changelog

<p align="center">
  <img src="https://img.shields.io/badge/Format-Keep%20a%20Changelog-blue.svg" alt="Keep a Changelog">
  <img src="https://img.shields.io/badge/Versioning-SemVer%202.0.0-green.svg" alt="Semantic Versioning">
  <img src="https://img.shields.io/badge/License-MIT-purple.svg" alt="License MIT">
  <img src="https://img.shields.io/badge/Repository-glastor--core%2Fzerho-informational" alt="Repository">
</p>

---

## Acerca de este Changelog

Todos los cambios notables en **Zerho (Next-Generation Documentation Engine, Interactive Playground
& Edge Portal)** son documentados en este archivo.

Este proyecto se adhiere a:

- **Formato:** [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
- **Versionado:** [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

### Categorías de Cambios

- **Added** ✨ - Nuevas características o funcionalidades
- **Changed** 🔄 - Cambios en funcionalidades existentes
- **Fixed** 🐛 - Correcciones de errores
- **Security** 🔒 - Mejoras de seguridad y protección

---

## [Unreleased]

### 💡 Planned

- Soporte para pre-renderizado de diagramas de arquitectura en SVG estático.
- Plugin oficial de autenticación perimetral OAuth para documentación privada corporativa.

---

## [1.7.0] - 2026-10-26

### ✨ Added

- **playground:** remove manual run button and enable debounced live auto-run (16e1948)

---
## [1.6.2] - 2026-10-26

### 🐛 Fixed

- **playground:** resolve Monaco CSP stylesheet blocking, add button spinner and execution feedback (58d91e9)

---
## [1.6.1] - 2026-10-26

### 🐛 Fixed

- **playground:** add unsafe-eval and worker-src to CSP and improve Monaco fallback (285b984)

---
## [1.6.0] - 2026-10-26

### ✨ Added

- **ai-i18n:** implement llms.txt standard, deno doc auto-reference, kv search insights, and
  declarative i18n (b2da55c)
---

## [1.5.0] - 2026-10-26

### ✨ Added

- **dx:** implement polyglot code-groups, dynamic sitemaps, and security hardening (53920ad)

---

## [1.4.0] - 2026-10-26

### ✨ Added

- **quality:** implement native git hooks and conventional commit verification without npm
  dependencies (2972b1e)

---

## [1.3.0] - 2026-10-26

### ✨ Added

- **security:** incorporate glastor-core/nemesis DevSecOps audit pipeline, .nemesis.yml config, and
  local audit task (17b705d)

---
## [1.2.1] - 2026-10-26

### 🔄 Changed

- rename all occurrences of ZerhoPress to Zerho across codebase (b5a9903)
---

## [1.2.0] - 2026-10-26

### ✨ Added

- **release:** implement automated semantic versioning, changelog generation, and CI bump workflows
  (6e4b818)
- adapt governance, citation, changelog, workflows, and Cloudflare Pages setup for
  glastor-core/zerho on main ( 2ea6e0b)
- configure full compatibility for VS Code, Cursor, Zed, JetBrains, and Neovim ( a56bb9b)
- establish comprehensive test suite, lint rules, format verification, and CI pipeline ( f6ac133)
- complete Pro suite with Monaco editor, Ask AI RAG, OpenAPI explorer, Deno KV analytics, and
  universal CLI ( 5055a61)
- initial commit of Zerho pro documentation engine for Deno ( 7acb69b)

---

## [1.1.0] - 2026-10-26

**Nombre del Release:** "Pro Developer Experience, Interactive Playground & Edge AI Suite"\
**Tipo de Release:** Minor Feature & Polish Release

### ✨ Added

- **Monaco Editor Integrado en el Navegador:** Editor VS Code completo con resaltado de sintaxis
  TypeScript, autocompletado e IntelliSense en vivo dentro del Playground (`docs/playground/`).
- **Sandbox V8 Sub-milisegundo (0.5ms):** Ejecución aislada en el cliente con emulación de APIs
  clave de Deno (`Deno.serve`, `Deno.version`, `Deno.readTextFile`, `crypto.subtle` SHA-256 y
  `ReadableStream`).
- **Explorador OpenAPI 3.1 Interactivo:**
  - Renderizador visual de esquemas y endpoints agrupados por tags.
  - Tablas de parámetros con tipos, requisitos y descripciones.
  - Generador de snippets de código dinámicos para **cURL**, **Deno (TypeScript)** y **Python**.
  - Panel interactivo **"Try It Out"** para emitir peticiones HTTP en tiempo real con cálculo de
    latencia y código de estado.
- **Buscador Spotlight (<kbd>⌘</kbd> + <kbd>K</kbd>) con "Preguntar a la IA" (RAG):**
  - Búsqueda instantánea de texto completo en el cliente.
  - Pestaña conversacional que consulta el endpoint perimetral `POST /api/ai/ask` y sintetiza
    respuestas con citas directas de la documentación.
- **Widget de Retroalimentación en Deno KV:**
  - Encuesta `¿Te ha resultado útil esta página?` integrada en el pie de página de cada artículo.
  - Persistencia atómica perimetral mediante `POST /api/feedback` y consulta de estadísticas en
    `GET /api/feedback/stats`.
- **CLI Universal de Zerho (`src/cli.ts`):**
  - Comandos: `zerho dev`, `zerho build`, `zerho serve`, `zerho init` y `zerho stats`.
- **Suite Integral de Calidad y Pruebas Automatizadas:**
  - 24 pruebas automatizadas con 78.9% de cobertura en 6 suites (`markdown`, `search`, `openapi`,
    `builder`, `server`, `cli`).
  - Tareas en `deno.json`: `test`, `test:cov`, `lint`, `fmt`, `fmt:check`, `check` y `ci`.
- **Compatibilidad Universal con Editores e IDEs:**
  - Configuraciones listas para usar para VS Code, Cursor, Windsurf, Zed, JetBrains WebStorm y
    Neovim (`.vscode/`, `.zed/`, `.editorconfig`, `.gitattributes`).

### 🔄 Changed

- Migración y alineación completa del repositorio a
  [glastor-core/zerho](https://github.com/glastor-core/zerho).
- Configuración para despliegue perimetral global en [zerho.xyz](https://zerho.xyz) (Cloudflare
  Pages y Deno Deploy).

---

## [1.0.0] - 2026-10-25

**Nombre del Release:** "Initial Core Engine Release"\
**Tipo de Release:** Major Initial Release

### ✨ Added

- **Compilador SSG Ultrarrápido:** Compilación de sitios estáticos completos en menos de 100ms.
- **Superpoderes Markdown:**
  - Callouts personalizados estilo VitePress (`::: tip`, `::: warning`, `::: info`, `::: danger`,
    `::: details`).
  - Alertas estilo GitHub (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`).
  - Pestañas de bloques de código con títulos de archivo (`ts [server.ts]`).
  - Bloques de código ejecutables en vivo (`ts run`) con consola emulada.
  - Integración nativa con diagramas Mermaid.
  - Extracción automática de tabla de contenidos (TOC) con scrollspy.
- **Servidor de Desarrollo Local con HMR:** Detección de cambios mediante file watcher y recarga en
  caliente por WebSocket.
- **Servidor Perimetral para Deno Deploy:** `main.ts` con servidor HTTP nativo, caché inmutable de
  assets y enrutamiento estático limpio.
- **Sistema de Diseño Nivel Pro:** Estética inspirada en Linear y Vercel con tema oscuro inmersivo,
  modo claro, glassmorphism y microanimaciones fluidas.
