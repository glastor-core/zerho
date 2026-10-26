# 🌌 Guía de Contribución y Estándares de Ingeniería — Zerho

Gracias por sumarte a la misión de construir y evolucionar **Zerho** dentro del ecosistema de
`**GLASTOR-DEV** (división de desarrollo de GLASTOR®)`. Zerho es un motor de documentación técnica
de ultra-alto rendimiento, playground interactivo en vivo y portal de APIs nativo para Deno 2 y
Cloudflare ([zerho.xyz](https://zerho.xyz)).

Valoramos la excelencia técnica, el rigor en experiencia de desarrollador (DX) y el compromiso con
los estándares web abiertos. Esta guía establece las directrices operativas y de ingeniería para
colaborar con máxima eficiencia.

---

## 🛠 Gestión de Incidencias

### 🐛 Reportes de Errores (Fidelidad Técnica)

Cada _issue_ debe actuar como un documento técnico verificable:

- **Resumen:** Descripción concisa del fallo y su impacto.
- **Protocolo de Reproducción:** Pasos exactos y deterministas para replicar el problema.
- **Entorno de Ejecución:**
  - Versión de Deno (`deno --version`)
  - Sistema Operativo (Linux, macOS, Windows)
  - Navegador web (Chrome, Firefox, Safari, Edge) si el problema ocurre en el playground o cliente.
- **Evidencia Técnica:** Logs de consola, capturas de pantalla o fragmentos de Markdown/TypeScript
  que provocan el error.

---

## 💻 Setup del Entorno de Desarrollo

### Requisitos Previos

- **Deno:** 2.0+ instalado ([instrucciones de instalación](https://deno.land/)).
- **Git:** 2.30+.

### 1. Clonación del Repositorio

```bash
git clone https://github.com/glastor-core/zerho.git
cd zerho
```

### 2. Tareas de Desarrollo Disponibles

Zerho gestiona todo su ciclo de vida directamente a través de `deno.json`:

```bash
# Iniciar servidor de desarrollo local con recarga en caliente (HMR)
deno task dev

# Compilar sitio estático para producción en dist/
deno task build

# Iniciar servidor perimetral de producción (Deno Deploy)
deno task serve

# Ejecutar suite de 24 pruebas automatizadas
deno task test

# Ejecutar pruebas con reporte de cobertura (LCOV y HTML)
deno task test:cov

# Formatear código automáticamente
deno task fmt

# Verificar análisis estático (linter)
deno task lint

# Pipeline completo de CI local (check, lint, fmt:check, test)
deno task ci
```

---

## 🚀 Flujo de Integración y Pull Requests

Para preservar la estabilidad de la rama principal (`main`), seguimos un flujo riguroso:

### 1. Rama de Trabajo

Crea una rama descriptiva partiendo de `main`:

```bash
git checkout -b feat/openapi-custom-servers
# o: git checkout -b fix/monaco-resize-observer
```

### 2. Estructura Arquitectónica

- `/src/core/`: Compilador Markdown (`markdown.ts`), constructor SSG (`builder.ts`), indexador de
  búsqueda (`search.ts`), generador OpenAPI (`openapi.ts`) y servidor HMR (`dev.ts`).
- `/src/client/`: Lógica de navegador para Monaco Editor (`playground.js`), explorador OpenAPI
  interactivo (`openapi-client.js`), buscador Spotlight (<kbd>⌘K</kbd>) y feedback (`app.js`),
  estilos Vanilla CSS (`theme.css`).
- `/src/templates/`: Motor de renderizado SSR y plantillas HTML semánticas (`layout.ts`).
- `/docs/`: Artículos y contenido de la documentación en Markdown.
- `/tests/`: Pruebas automatizadas para cada módulo del sistema.

### 3. Verificación Local Obligatoria

Antes de enviar un Pull Request, ejecuta la verificación continua para certificar que no existen
regresiones:

```bash
deno task ci
```

### 4. Protocolo de Commits (Conventional Commits)

Implementamos la especificación de [Conventional Commits](./COMMIT_CONVENTION.md):

```bash
git commit -m "feat(markdown): support mermaid sequence diagrams"
git commit -m "fix(openapi): properly handle path parameters in live requests"
```

Prefijos permitidos: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `ci:`,
`chore:`.

### 5. Publicación y PR

Envía tu rama al repositorio remoto y abre un Pull Request hacia la rama `main`:

```bash
git push origin feat/openapi-custom-servers
```

---

## 📧 Canales de Comunicación y Soporte

- **GitHub Discussions:**
  [glastor-core/zerho/discussions](https://github.com/glastor-core/zerho/discussions)
- **GitHub Issues:** [glastor-core/zerho/issues](https://github.com/glastor-core/zerho/issues)
- **Portal en Producción:** [zerho.xyz](https://zerho.xyz)
- **Email Oficial:** [glastor.info@gmail.com](mailto:glastor.info@gmail.com)
- **Telegram Directo:** [@zerhocool](https://t.me/zerhocool)

---

## Código de Conducta

Este proyecto se rige bajo nuestro [Código de Conducta](./CODE_OF_CONDUCT.md). Fomentamos un entorno
de respeto mutuo, inclusión y rigor profesional.

© 2026 Andrés Antonio Cardoso — GLASTOR®. Todos los derechos reservados.
