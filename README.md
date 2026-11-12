# ⚡ Zerho

<p align="center">
  <strong>The pro-grade technical documentation engine built natively for Deno 2 and Deno Deploy.</strong>
</p>

<p align="center">
  <a href="https://github.com/denolib/awesome-deno"><img src="https://awesome.re/mentioned-badge.svg" alt="Mentioned in Awesome Deno" /></a>
  <a href="https://jsr.io/@glastor/zerho"><img src="https://jsr.io/badges/@glastor/zerho/score" alt="JSR Score" /></a>
  <a href="https://jsr.io/@glastor/zerho"><img src="https://jsr.io/badges/@glastor/zerho" alt="JSR Package" /></a>
  <a href="https://github.com/glastor-core/homebrew-tap"><img src="https://img.shields.io/badge/Homebrew-brew_install_zerho-orange?style=for-the-badge&logo=homebrew&logoColor=white" alt="Homebrew Tap" /></a>
  <img src="https://img.shields.io/badge/Deno-2.x-000000?style=for-the-badge&logo=deno&logoColor=white" alt="Deno 2" />
  <img src="https://img.shields.io/badge/Deno_Deploy-Live-06b6d4?style=for-the-badge&logo=deno&logoColor=white" alt="Deno Deploy" />
  <img src="https://img.shields.io/badge/CI-Passing-10b981?style=for-the-badge&logo=githubactions&logoColor=white" alt="CI Status" />
  <img src="https://img.shields.io/badge/LLMs.txt-Supported-8b5cf6?style=for-the-badge" alt="LLMs.txt Supported" />
  <a href="https://github.com/glastor-core/nemesis"><img src="https://img.shields.io/badge/Security-Nemesis_Audit-purple?style=for-the-badge" alt="Nemesis Security Audit" /></a>
  <a href="https://github.com/glastor-core/specter"><img src="https://img.shields.io/badge/API_Contract-Specter_v1-8b5cf6?style=for-the-badge" alt="Specter API Contract Gatekeeper" /></a>
  <a href="https://github.com/glastor-core/vortex"><img src="https://img.shields.io/badge/Predictive_CI-Vortex_v1-06b6d4?style=for-the-badge" alt="Vortex Predictive CI" /></a>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
  <br><br>
  <a href="https://github.com/glastor-core/zerho"><img src="https://img.shields.io/github/stars/glastor-core/zerho?style=social" alt="GitHub Stars" /></a>
  <a href="https://github.com/glastor-dev"><img src="https://img.shields.io/github/followers/glastor-dev?label=Follow%20%40glastor-dev&style=social" alt="Follow @glastor-dev" /></a>
</p>

<p align="center">
  <a href="https://zerho.glastor-dev.deno.net/"><strong>Explore Live Documentation &rarr;</strong></a> |
  <a href="https://zerho.xyz/llms.txt"><strong>LLMs.txt Context &rarr;</strong></a>
</p>

---

## 🚀 Why Zerho Outperforms VitePress and Traditional Tools

| Feature                       |         VitePress / Docusaurus          |                     Zerho Pro on Deno 2                     |
| :---------------------------- | :-------------------------------------: | :---------------------------------------------------------: |
| **Runtime Base**              | Node.js + npm + `node_modules` (400MB+) |             **Native Deno 2 (0 node_modules)**              |
| **Live Playground**           |      ❌ Requires external plugins       |         **✅ Integrated TypeScript / Deno Sandbox**         |
| **Executable Blocks**         |         Static copy-only blocks         |        **✅ `ts run` with live interactive console**        |
| **AI Support (LLMs.txt)**     |       ❌ Not available of-the-box       |  **✅ Native `/llms.txt`, `/llms-full.txt` & `/api/mcp`**   |
| **Auto-Docs from Source**     |       Requires TypeDoc / plugins        |    **✅ Built-in `deno doc --json` + strict validation**    |
| **OpenAPI 3.0 / 3.1**         |           Third-party plugins           | **✅ Official `$ref` parser + 5-language code gen + Live**  |
| **UI Components & KaTeX**     |          Requires MDX / React           | **✅ Native `steps`, `tabs`, `cards`, `file-tree` & LaTeX** |
| **Doc Testing (`test:docs`)** |       ❌ Not available of-the-box       |  **✅ Validates & executes TS/JS blocks inside Markdown**   |
| **Polyglot Code-Groups**      |          Requires Node bundler          |      **✅ Global client-side sync via `localStorage`**      |
| **Telemetry & Insights**      |        Third-party cookies (GA4)        | **✅ Edge Deno KV (queries & unanswered search insights)**  |
| **Internationalization**      |          Complex configuration          |        **✅ Declarative N-language i18n + RSS & OG**        |
| **Edge Deployment**           |      Manual adapter configuration       |           **✅ 1-Click Deno Deploy (`main.ts`)**            |
| **Instant Search**            |     External Algolia / basic local      |         **✅ Indexed Cmd+K spotlight search modal**         |
| **Mermaid Diagrams**          |              Extra plugin               |               **✅ Built-in out-of-the-box**                |
| **Build Time**                |              ~2.5 seconds               |               **~90 milliseconds (14 pages)**               |
| **UI Aesthetics**             |          Classic default theme          |        **Linear / Vercel design with Glassmorphism**        |

---

## ⚡ Quick Start

You only need [Deno 2](https://deno.com) installed.

```bash
# 0. (Optional) Scaffold Zerho into any existing repository with 1 command
deno run -A jsr:@zerho/core/init

# 1. Start local development server with Live-Reload (WebSocket HMR)
deno task dev

# 2. Build static documentation for production (generates dist/ with sitemap, OG SVG, RSS & llms.txt)
deno task build

# 3. Verify syntax and live execution of all Markdown code blocks
deno task test:docs

# 4. Serve in production mode with Edge security headers, MCP Server & Deno KV
deno task serve
```

---

## 🛠️ Project Structure

```text
zerho/
├── deno.json               # Official Deno 2, JSR, and task configuration
├── zerho.config.ts         # Metadata, i18n, navigation, sidebar, and apiDocs
├── main.ts                 # Edge perimeter server with Deno KV and AppSec headers
├── docs/                   # Markdown documentation content
│   ├── index.md            # Main landing page (layout: home)
│   ├── reference.md        # Auto-generated API reference via deno doc
│   ├── guide/              # Guides in Spanish (getting-started, configuration, etc.)
│   ├── en/                 # Internationalized documentation in English
│   ├── playground/         # Interactive TypeScript playground
│   └── api/                # Runtime API reference and OpenAPI specs
├── src/
│   ├── core/
│   │   ├── docgen.ts       # API reference generator analyzing Deno Doc AST
│   │   ├── builder.ts      # Ultra-fast SSG generator with sitemap, robots, RSS & llms.txt
│   │   ├── markdown.ts     # Markdown compiler with ::: code-group, UI components & callouts
│   │   ├── dev.ts          # Development server with WebSocket HMR
│   │   └── search.ts       # Client-side search indexer
│   ├── client/
│   │   ├── theme.css       # Pro theme styling (Glassmorphism, Dark/Light, i18n, Neon Glow)
│   │   ├── app.js          # Client-side controller (Theme, ScrollSpy, Cmd+K, Tabs Sync)
│   │   └── playground.js   # Client-side Web Worker execution sandbox simulating Deno
│   └── templates/
│       └── layout.ts       # HTML layout template with SEO, OpenGraph SVG & LLM manifests
└── dist/                   # Production-ready compiled static output
```

---

## 🌐 Deployment on Deno Deploy

### Option 1: Automatic GitHub Integration (Recommended)

1. Connect your repository on [dash.deno.com](https://dash.deno.com).
2. Select `main.ts` as the entrypoint and `deno task build` as the build command.
3. Done! Every `git push` deploys across 35+ edge regions worldwide with sub-10ms latency.

### Option 2: Direct CLI Deployment

```bash
deno run -A jsr:@deno/deployctl deploy --project=zerho main.ts
```

---

## 🛡️ Governance, Security & Community

This project adheres to the highest standards of quality, security, and open-source governance on
GitHub:

- **[Security Policy (.github/SECURITY.md)](.github/SECURITY.md)**: Coordinated vulnerability
  disclosure protocol.
- **[Contributing Guide (.github/CONTRIBUTING.md)](.github/CONTRIBUTING.md)**: Development workflow,
  commit conventions, and verification suite.
- **[Code of Conduct (.github/CODE_OF_CONDUCT.md)](.github/CODE_OF_CONDUCT.md)**: Contributor
  Covenant v2.1 standard.
- **[Changelog (CHANGELOG.md)](CHANGELOG.md)**: Adheres to Keep a Changelog and Semantic Versioning
  (SemVer).
- **[Academic Citation (CITATION.cff)](CITATION.cff)**: Formal software citation metadata.
- **[Contributors (CONTRIBUTORS.md)](CONTRIBUTORS.md)**: Team and acknowledgments.

---

## ⭐ Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=glastor-core/zerho&type=Date)](https://star-history.com/#glastor-core/zerho&Date)

*If you find Zerho useful, please consider starring the repository and following [@glastor-dev](https://github.com/glastor-dev) on GitHub!*

</div>

---

## 📄 License

[MIT License](LICENSE) © 2026 GLASTOR® / Zerho.
