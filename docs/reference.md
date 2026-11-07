---
title: Referencia de API (Deno Doc)
description: Referencia técnica generada automáticamente a partir del código fuente mediante deno doc
layout: doc
---

# Referencia de API (Deno Doc)

> Esta página de referencia se compila automáticamente analizando las firmas de tipos y comentarios JSDoc con **`deno doc`**.

---

## Índice de Símbolos

- [**BuildOptions**](#buildoptions) (`interface`)
- [**LlmsPageEntry**](#llmspageentry) (`interface`)
- [**generateSitemapXml**](#generatesitemapxml) (`function`)
- [**generateRobotsTxt**](#generaterobotstxt) (`function`)
- [**generateLlmsTxt**](#generatellmstxt) (`function`)
- [**generateLlmsFullTxt**](#generatellmsfulltxt) (`function`)
- [**generateRssFeedXml**](#generaterssfeedxml) (`function`)
- [**generateOgImageSvg**](#generateogimagesvg) (`function`)
- [**resolveConfigForPath**](#resolveconfigforpath) (`function`)
- [**DeadLinkIssue**](#deadlinkissue) (`interface`)
- [**loadUserConfig**](#loaduserconfig) (`function`)
- [**generateAutoSidebar**](#generateautosidebar) (`function`)
- [**validateInternalLinks**](#validateinternallinks) (`function`)
- [**buildSite**](#buildsite) (`function`)
- [**TocItem**](#tocitem) (`interface`)
- [**Frontmatter**](#frontmatter) (`interface`)
- [**ParsedMarkdown**](#parsedmarkdown) (`interface`)
- [**slugify**](#slugify) (`function`)
- [**processCodeGroups**](#processcodegroups) (`function`)
- [**processMarkdownIncludes**](#processmarkdownincludes) (`function`)
- [**processCodeTransclusions**](#processcodetransclusions) (`function`)
- [**processSteps**](#processsteps) (`function`)
- [**processContentTabs**](#processcontenttabs) (`function`)
- [**processCardsGrid**](#processcardsgrid) (`function`)
- [**processFileTree**](#processfiletree) (`function`)
- [**processMathExpressions**](#processmathexpressions) (`function`)
- [**parseMarkdown**](#parsemarkdown) (`function`)
- [**SearchDocument**](#searchdocument) (`interface`)
- [**SearchResult**](#searchresult) (`interface`)
- [**expandSemanticTerms**](#expandsemanticterms) (`function`)
- [**SearchIndexer**](#searchindexer) (`class`)

---

## BuildOptions
**Tipo:** `interface` | **Ubicación:** [`builder.ts:9`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L9)

Options configuring the Zerho static site generator compilation process.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `devMode` | `boolean` | Sí | Run builder in development mode enabling livereload and development banners |
| `outDir` | `string` | Sí | Output directory path for compiled static assets (defaults to 'dist') |
| `docsDir` | `string` | Sí | Source documentation directory containing Markdown files (defaults to 'docs') |
| `skipDocgen` | `boolean` | Sí | Skip automatic generation of API reference documentation via deno doc |
| `config` | `ZerhoConfig` | Sí | Optional explicit ZerhoConfig override |

---

## LlmsPageEntry
**Tipo:** `interface` | **Ubicación:** [`builder.ts:23`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L23)

Represents an indexed page entry prepared for LLM and agent ingestion.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `title` | `string` | No | Title of the document |
| `description` | `string` | No | Summary description extracted from frontmatter or generated |
| `route` | `string` | No | Canonical route URL path |
| `rawContent` | `string` | No | Clean Markdown content ready for LLM consumption |

---

## generateSitemapXml
**Tipo:** `function` | **Ubicación:** [`builder.ts:40`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L40)

Generates standards-compliant sitemap.xml for search engines and SEO crawlers.

```typescript
function generateSitemapXml(routes: string[], baseUrl = "https://zerho.xyz"): string;
```

**Retorna:** `string` — Formatted XML sitemap string

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `routes` | `string[]` | No | — | List of canonical URL paths to include in the sitemap |
| `baseUrl` | `string` | Sí | `"https://zerho.xyz"` | Canonical production domain origin |

---

## generateRobotsTxt
**Tipo:** `function` | **Ubicación:** [`builder.ts:59`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L59)

Generates robots.txt pointing to the production sitemap.

```typescript
function generateRobotsTxt(baseUrl = "https://zerho.xyz"): string;
```

**Retorna:** `string` — Formatted robots.txt string

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | Sí | `"https://zerho.xyz"` | Canonical production domain origin |

---

## generateLlmsTxt
**Tipo:** `function` | **Ubicación:** [`builder.ts:71`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L71)

Generates /llms.txt according to the llmstxt.org specification for LLM agents.

```typescript
function generateLlmsTxt(pages: LlmsPageEntry[], baseUrl = "https://zerho.xyz", siteTitle = "Zerho", siteDescription = "El motor de documentación de nivel pro diseñado nativamente para Deno & Deno Deploy"): string;
```

**Retorna:** `string` — Formatted Markdown llms.txt string

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `pages` | `LlmsPageEntry[]` | No | — | Indexed documentation pages |
| `baseUrl` | `string` | Sí | `"https://zerho.xyz"` | Canonical production domain origin |
| `siteTitle` | `string` | Sí | `"Zerho"` | Site brand title |
| `siteDescription` | `string` | Sí | `"El motor de documentación de nivel pro diseñado nativamente para Deno & Deno Deploy"` | Concise tagline or description |

---

## generateLlmsFullTxt
**Tipo:** `function` | **Ubicación:** [`builder.ts:111`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L111)

Generates /llms-full.txt containing the entire concatenated documentation for direct LLM ingestion.

```typescript
function generateLlmsFullTxt(pages: LlmsPageEntry[], baseUrl = "https://zerho.xyz", siteTitle = "Zerho"): string;
```

**Retorna:** `string` — Consolidated Markdown documentation string

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `pages` | `LlmsPageEntry[]` | No | — | Indexed documentation pages |
| `baseUrl` | `string` | Sí | `"https://zerho.xyz"` | Canonical production domain origin |
| `siteTitle` | `string` | Sí | `"Zerho"` | Site brand title |

---

## generateRssFeedXml
**Tipo:** `function` | **Ubicación:** [`builder.ts:142`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L142)

Generates an RSS 2.0 XML feed (/feed.xml) for documentation updates and release syndication.

```typescript
function generateRssFeedXml(pages: LlmsPageEntry[], baseUrl = "https://zerho.xyz", siteTitle = "Zerho", siteDescription = "Documentación técnica impulsada por Zerho"): string;
```

**Retorna:** `string` — Standards-compliant RSS 2.0 XML string

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `pages` | `LlmsPageEntry[]` | No | — | Indexed documentation pages |
| `baseUrl` | `string` | Sí | `"https://zerho.xyz"` | Canonical production domain origin |
| `siteTitle` | `string` | Sí | `"Zerho"` | Site brand title |
| `siteDescription` | `string` | Sí | `"Documentación técnica impulsada por Zerho"` | Concise tagline or description |

---

## generateOgImageSvg
**Tipo:** `function` | **Ubicación:** [`builder.ts:191`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L191)

Generates a dynamic OpenGraph SVG preview card (1200x630) for social sharing on X, Discord, and Slack.

```typescript
function generateOgImageSvg(title: string, description: string, siteTitle = "Zerho", primaryColor = "#7c3aed"): string;
```

**Retorna:** `string` — Complete 1200x630 SVG document string

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | No | — | Page title |
| `description` | `string` | No | — | Page summary description |
| `siteTitle` | `string` | Sí | `"Zerho"` | Brand or project title |
| `primaryColor` | `string` | Sí | `"#7c3aed"` | Primary brand hex color |

---

## resolveConfigForPath
**Tipo:** `function` | **Ubicación:** [`builder.ts:236`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L236)

Resolves effective configuration applying locale overrides if currentPath belongs to a registered locale.

```typescript
function resolveConfigForPath(baseConfig: ZerhoConfig, path: string): ZerhoConfig;
```

**Retorna:** `ZerhoConfig` — Localized configuration object

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `baseConfig` | `ZerhoConfig` | No | — | Global root Zerho configuration |
| `path` | `string` | No | — | Current route path being rendered |

---

## DeadLinkIssue
**Tipo:** `interface` | **Ubicación:** [`builder.ts:262`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L262)

Represents a broken internal link or missing anchor fragment detected during site compilation.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `sourceRoute` | `string` | No | Route of the page containing the broken link |
| `targetHref` | `string` | No | Target href attribute that failed validation |
| `reason` | `string` | No | Human-readable explanation of why the link is invalid |

---

## loadUserConfig
**Tipo:** `function` | **Ubicación:** [`builder.ts:277`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L277)

Dynamically loads a project's local `zerho.config.ts` from the given workspace root,
falling back to the default engine configuration if not present.

```typescript
function loadUserConfig(workspaceDir = {}): Promise<ZerhoConfig>;
```

**Retorna:** `Promise<ZerhoConfig>` — Resolved ZerhoConfig object

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `workspaceDir` | `string` | Sí | `{}` | Project root directory (defaults to Deno.cwd()) |

---

## generateAutoSidebar
**Tipo:** `function` | **Ubicación:** [`builder.ts:305`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L305)

Generates an automatic sidebar hierarchy from discovered documentation pages,
grouped by top-level directory and sorted by frontmatter `order` then title.

```typescript
function generateAutoSidebar(pages: Array<any>): SidebarItem[];
```

**Retorna:** `SidebarItem[]` — Generated array of SidebarItem groups

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `pages` | `Array<any>` | No | — | Discovered compiled pages with routes and parsed metadata |

---

## validateInternalLinks
**Tipo:** `function` | **Ubicación:** [`builder.ts:351`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L351)

Validates internal links and heading anchors across all compiled documentation pages.

```typescript
function validateInternalLinks(pages: Array<any>, knownRoutes: Set<string>): DeadLinkIssue[];
```

**Retorna:** `DeadLinkIssue[]` — List of broken internal links or missing anchor targets

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `pages` | `Array<any>` | No | — | Compiled pages with route, rendered HTML, and table-of-contents anchor IDs |
| `knownRoutes` | `Set<string>` | No | — | Set of valid canonical routes in the site |

---

## buildSite
**Tipo:** `function` | **Ubicación:** [`builder.ts:433`](https://github.com/glastor-core/zerho/blob/main/src/core/builder.ts#L433)

Compiles Markdown documentation into static HTML, CSS, search index, and LLM endpoints.

```typescript
function buildSite(options = {}): Promise<void>;
```

**Retorna:** `Promise<void>` — Promise resolving when site compilation is complete

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `options` | `BuildOptions` | Sí | `{}` | Build configuration options |

---

## TocItem
**Tipo:** `interface` | **Ubicación:** [`markdown.ts:25`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L25)

Represents an entry in the document's Table of Contents (TOC) hierarchy.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `string` | No | Unique anchor fragment identifier |
| `text` | `string` | No | Visible heading title text |
| `level` | `number` | No | Heading depth level (e.g. 2 for h2, 3 for h3) |

---

## Frontmatter
**Tipo:** `interface` | **Ubicación:** [`markdown.ts:35`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L35)

Schema for document YAML frontmatter metadata and layout settings.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Sí | Document page title |
| `description` | `string` | Sí | Meta description for search engines and SEO |
| `order` | `number` | Sí | Numeric ordering index used when generating automatic sidebars |
| `layout` | `doc \| home \| page` | Sí | Layout mode: 'doc' for documentation with sidebar, 'home' for hero landing, 'page' for generic |
| `hero` | `any` | Sí | Hero banner configuration for landing pages |
| `features` | `Array<any>` | Sí | Feature cards displayed on landing pages |
| `editLink` | `boolean` | Sí | Whether to render an edit link pointing to the repository source |
| `prev` | `any` | Sí | Previous page navigation link |
| `next` | `any` | Sí | Next page navigation link |

---

## ParsedMarkdown
**Tipo:** `interface` | **Ubicación:** [`markdown.ts:78`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L78)

Result of compiling a Markdown document with frontmatter, HTML, and analytics.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `frontmatter` | `Frontmatter` | No | Extracted YAML frontmatter metadata |
| `html` | `string` | No | Rendered HTML output with syntax highlighting and callouts |
| `toc` | `TocItem[]` | No | Extracted Table of Contents hierarchy for the right sidebar |
| `readingTimeMin` | `number` | No | Estimated reading time in minutes |
| `wordCount` | `number` | No | Total word count of the body |
| `plainText` | `string` | No | Plain text representation used for full-text search indexing |

---

## slugify
**Tipo:** `function` | **Ubicación:** [`markdown.ts:98`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L98)

Normalizes a heading string into a URL-safe, accent-free anchor slug.

```typescript
function slugify(text: string): string;
```

**Retorna:** `string` — Normalized URL slug

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `text` | `string` | No | — | Raw heading text |

---

## processCodeGroups
**Tipo:** `function` | **Ubicación:** [`markdown.ts:251`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L251)

Transforms VitePress-style `::: code-group` blocks into tabbed interactive HTML code panels.

```typescript
function processCodeGroups(markdown: string): string;
```

**Retorna:** `string` — Transformed Markdown with HTML tab structures

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content containing code-group directives |

---

## processMarkdownIncludes
**Tipo:** `function` | **Ubicación:** [`markdown.ts:332`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L332)

Resolves and inlines Markdown partial includes (`<!-- @include: ./partial.md -->`)

```typescript
function processMarkdownIncludes(markdown: string, baseDir = {}): Promise<string>;
```

**Retorna:** `Promise<string>` — Markdown with included files expanded inline

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |
| `baseDir` | `string` | Sí | `{}` | Base directory used to resolve relative paths |

---

## processCodeTransclusions
**Tipo:** `function` | **Ubicación:** [`markdown.ts:365`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L365)

Resolves VitePress-style source code transclusions (`<<< @/src/file.ts#L1-L10 [label]`)
directly from the project repository so code examples never go out of sync.

```typescript
function processCodeTransclusions(markdown: string, baseDir = {}): Promise<string>;
```

**Retorna:** `Promise<string>` — Markdown with transcluded source files converted into fenced code blocks

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |
| `baseDir` | `string` | Sí | `{}` | Base directory of the project workspace |

---

## processSteps
**Tipo:** `function` | **Ubicación:** [`markdown.ts:411`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L411)

Transforms `::: steps ... :::` containers into a numbered vertical stepper guide.

```typescript
function processSteps(markdown: string): string;
```

**Retorna:** `string` — Markdown with stepper containers converted into structured HTML

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |

---

## processContentTabs
**Tipo:** `function` | **Ubicación:** [`markdown.ts:438`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L438)

Transforms `::: tabs ... :::` with `@tab Title` directives into general-purpose interactive content tabs.

```typescript
function processContentTabs(markdown: string): string;
```

**Retorna:** `string` — Markdown with content tabs rendered as accessible tablist panels

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |

---

## processCardsGrid
**Tipo:** `function` | **Ubicación:** [`markdown.ts:481`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L481)

Transforms `::: cards ... :::` directives into a Mintlify/Starlight-style responsive feature card grid.
Format per line: `- [Title](url) :: Description` or `- [Icon] [Title](url) :: Description`

```typescript
function processCardsGrid(markdown: string): string;
```

**Retorna:** `string` — Markdown with card grids converted into HTML cards

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |

---

## processFileTree
**Tipo:** `function` | **Ubicación:** [`markdown.ts:519`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L519)

Transforms `::: file-tree ... :::` containers into a styled directory & file hierarchy tree.

```typescript
function processFileTree(markdown: string): string;
```

**Retorna:** `string` — Markdown with file-tree lists rendered with folder and file icons

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |

---

## processMathExpressions
**Tipo:** `function` | **Ubicación:** [`markdown.ts:547`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L547)

Transforms LaTeX mathematical expressions (`$$...$$` display blocks and `$...$` inline formulas)
into semantic math containers for KaTeX rendering, ignoring fenced code blocks and currency values.

```typescript
function processMathExpressions(markdown: string): string;
```

**Retorna:** `string` — Markdown with math formulas wrapped in `.math-block` and `.math-inline` elements

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `markdown` | `string` | No | — | Raw Markdown content |

---

## parseMarkdown
**Tipo:** `function` | **Ubicación:** [`markdown.ts:583`](https://github.com/glastor-core/zerho/blob/main/src/core/markdown.ts#L583)

Parses raw Markdown text into structured HTML, extracting frontmatter, TOC, and reading time.

```typescript
function parseMarkdown(rawContent: string, baseDir = {}): Promise<ParsedMarkdown>;
```

**Retorna:** `Promise<ParsedMarkdown>` — Promise resolving to the parsed document metadata and HTML

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `rawContent` | `string` | No | — | Raw Markdown file content including frontmatter |
| `baseDir` | `string` | Sí | `{}` | Optional project root directory for resolving code transclusions and includes |

---

## SearchDocument
**Tipo:** `interface` | **Ubicación:** [`search.ts:1`](https://github.com/glastor-core/zerho/blob/main/src/core/search.ts#L1)

Represents an indexed document item in the Zerho client-side search engine.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `string` | No | Unique document identifier hash or slug |
| `url` | `string` | No | Canonical link URL |
| `title` | `string` | No | Primary document or section title |
| `section` | `string` | Sí | Sub-section heading title if applicable |
| `content` | `string` | No | Plain text content indexed for term matching |

---

## SearchResult
**Tipo:** `interface` | **Ubicación:** [`search.ts:15`](https://github.com/glastor-core/zerho/blob/main/src/core/search.ts#L15)

Represents a weighted search query hit returned by the search engine.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `item` | `SearchDocument` | No | The matching search document |
| `score` | `number` | No | Relevance score calculated by exact and partial term matches |

---

## expandSemanticTerms
**Tipo:** `function` | **Ubicación:** [`search.ts:146`](https://github.com/glastor-core/zerho/blob/main/src/core/search.ts#L146)

Expands primary query terms with semantically related domain synonyms.

```typescript
function expandSemanticTerms(primaryTerms: string[]): string[];
```

**Retorna:** `string[]` — Array of semantically related expansion terms not already in primaryTerms

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `primaryTerms` | `string[]` | No | — | Cleaned user query terms |

---

## SearchIndexer
**Tipo:** `class` | **Ubicación:** [`search.ts:168`](https://github.com/glastor-core/zerho/blob/main/src/core/search.ts#L168)

In-memory client-side and server-side search indexer and query ranking engine.

### Propiedades

| Propiedad | Visibilidad | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| `docs` | `private` | `SearchDocument[]` | — |

### Métodos

#### `addDocument(doc: SearchDocument): void`

Adds a document to the search index collection.

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `doc` | `SearchDocument` | No | — | Search document to index |

#### `getDocuments(): SearchDocument[]`

Returns a copy of all currently indexed documents.

#### `toJSON(): string`

Serializes the search index into formatted JSON for client download.

#### `static fromJSON(jsonStr: string): SearchIndexer`

Reconstructs a SearchIndexer instance from serialized JSON.

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `jsonStr` | `string` | No | — | Serialized JSON documents array |

#### `search(query: string, limit = 10): SearchResult[]`

Executes a weighted multi-term search query across titles, sections, and bodies.

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `query` | `string` | No | — | Search keywords or phrase |
| `limit` | `number` | Sí | `10` | Maximum number of ranked results to return |

---
