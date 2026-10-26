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
- [**resolveConfigForPath**](#resolveconfigforpath) (`function`)
- [**buildSite**](#buildsite) (`function`)
- [**TocItem**](#tocitem) (`interface`)
- [**Frontmatter**](#frontmatter) (`interface`)
- [**ParsedMarkdown**](#parsedmarkdown) (`interface`)
- [**processCodeGroups**](#processcodegroups) (`function`)
- [**parseMarkdown**](#parsemarkdown) (`function`)
- [**SearchDocument**](#searchdocument) (`interface`)
- [**SearchResult**](#searchresult) (`interface`)
- [**SearchIndexer**](#searchindexer) (`class`)

---

## BuildOptions
**Tipo:** `interface` | **Ubicación:** `builder.ts:9`

Options configuring the Zerho static site generator compilation process.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `devMode` | `boolean` | Sí | Run builder in development mode enabling livereload and development banners |
| `outDir` | `string` | Sí | Output directory path for compiled static assets (defaults to 'dist') |
| `docsDir` | `string` | Sí | Source documentation directory containing Markdown files (defaults to 'docs') |
| `skipDocgen` | `boolean` | Sí | Skip automatic generation of API reference documentation via deno doc |

---

## LlmsPageEntry
**Tipo:** `interface` | **Ubicación:** `builder.ts:21`

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
**Tipo:** `function` | **Ubicación:** `builder.ts:38`

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
**Tipo:** `function` | **Ubicación:** `builder.ts:57`

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
**Tipo:** `function` | **Ubicación:** `builder.ts:69`

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
**Tipo:** `function` | **Ubicación:** `builder.ts:109`

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

## resolveConfigForPath
**Tipo:** `function` | **Ubicación:** `builder.ts:138`

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

## buildSite
**Tipo:** `function` | **Ubicación:** `builder.ts:168`

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
**Tipo:** `interface` | **Ubicación:** `markdown.ts:15`

Represents an entry in the document's Table of Contents (TOC) hierarchy.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `string` | No | Unique anchor fragment identifier |
| `text` | `string` | No | Visible heading title text |
| `level` | `number` | No | Heading depth level (e.g. 2 for h2, 3 for h3) |

---

## Frontmatter
**Tipo:** `interface` | **Ubicación:** `markdown.ts:25`

Schema for document YAML frontmatter metadata and layout settings.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Sí | Document page title |
| `description` | `string` | Sí | Meta description for search engines and SEO |
| `layout` | `doc \| home \| page` | Sí | Layout mode: 'doc' for documentation with sidebar, 'home' for hero landing, 'page' for generic |
| `hero` | `any` | Sí | Hero banner configuration for landing pages |
| `features` | `Array<any>` | Sí | Feature cards displayed on landing pages |
| `editLink` | `boolean` | Sí | Whether to render an edit link pointing to the repository source |
| `prev` | `any` | Sí | Previous page navigation link |
| `next` | `any` | Sí | Next page navigation link |

---

## ParsedMarkdown
**Tipo:** `interface` | **Ubicación:** `markdown.ts:59`

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

## processCodeGroups
**Tipo:** `function` | **Ubicación:** `markdown.ts:195`

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

## parseMarkdown
**Tipo:** `function` | **Ubicación:** `markdown.ts:275`

Parses raw Markdown text into structured HTML, extracting frontmatter, TOC, and reading time.

```typescript
function parseMarkdown(rawContent: string): Promise<ParsedMarkdown>;
```

**Retorna:** `Promise<ParsedMarkdown>` — Promise resolving to the parsed document metadata and HTML

### Parámetros

| Parámetro | Tipo | Opcional | Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `rawContent` | `string` | No | — | Raw Markdown file content including frontmatter |

---

## SearchDocument
**Tipo:** `interface` | **Ubicación:** `search.ts:1`

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
**Tipo:** `interface` | **Ubicación:** `search.ts:15`

Represents a weighted search query hit returned by the search engine.

### Propiedades

| Propiedad | Tipo | Opcional | Descripción |
| :--- | :--- | :--- | :--- |
| `item` | `SearchDocument` | No | The matching search document |
| `score` | `number` | No | Relevance score calculated by exact and partial term matches |

---

## SearchIndexer
**Tipo:** `class` | **Ubicación:** `search.ts:23`

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
