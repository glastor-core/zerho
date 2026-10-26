---
title: Referencia de API (Deno Doc)
description: Referencia técnica generada automáticamente a partir del código fuente mediante deno doc
layout: doc
---

# Referencia de API (Deno Doc)

> Esta página de referencia se compila automáticamente analizando las firmas de tipos y comentarios JSDoc con **`deno doc`**.

---

## Índice de Simbolos

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

## BuildOptions {#buildoptions}
**Tipo:** `interface` | **Ubicación:** `builder.ts:8`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `devMode` | `boolean` | — |
| `outDir` | `string` | — |
| `docsDir` | `string` | — |
| `skipDocgen` | `boolean` | — |

---

## LlmsPageEntry {#llmspageentry}
**Tipo:** `interface` | **Ubicación:** `builder.ts:15`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `title` | `string` | — |
| `description` | `string` | — |
| `route` | `string` | — |
| `rawContent` | `string` | — |

---

## generateSitemapXml {#generatesitemapxml}
**Tipo:** `function` | **Ubicación:** `builder.ts:25`

Generates standards-compliant sitemap.xml for SEO crawlers.

```typescript
function generateSitemapXml(routes: any, arg: any): string;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `routes` | `any` | No |
| `arg` | `any` | No |

---

## generateRobotsTxt {#generaterobotstxt}
**Tipo:** `function` | **Ubicación:** `builder.ts:42`

Generates robots.txt pointing to the production sitemap.

```typescript
function generateRobotsTxt(arg: any): string;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `arg` | `any` | No |

---

## generateLlmsTxt {#generatellmstxt}
**Tipo:** `function` | **Ubicación:** `builder.ts:49`

Generates /llms.txt according to the llmstxt.org specification for LLM agents.

```typescript
function generateLlmsTxt(pages: any, arg: any, arg: any, arg: any): string;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `pages` | `any` | No |
| `arg` | `any` | No |
| `arg` | `any` | No |
| `arg` | `any` | No |

---

## generateLlmsFullTxt {#generatellmsfulltxt}
**Tipo:** `function` | **Ubicación:** `builder.ts:85`

Generates /llms-full.txt containing the entire concatenated documentation for direct LLM ingestion.

```typescript
function generateLlmsFullTxt(pages: any, arg: any, arg: any): string;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `pages` | `any` | No |
| `arg` | `any` | No |
| `arg` | `any` | No |

---

## resolveConfigForPath {#resolveconfigforpath}
**Tipo:** `function` | **Ubicación:** `builder.ts:111`

Resolves effective configuration applying locale overrides if currentPath belongs to a registered locale.

```typescript
function resolveConfigForPath(baseConfig: ZerhoConfig, path: string): ZerhoConfig;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `baseConfig` | `ZerhoConfig` | No |
| `path` | `string` | No |

---

## buildSite {#buildsite}
**Tipo:** `function` | **Ubicación:** `builder.ts:136`

Sin descripción JSDoc proporcionada.

```typescript
function buildSite(arg: any): Promise;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `arg` | `any` | No |

---

## TocItem {#tocitem}
**Tipo:** `interface` | **Ubicación:** `markdown.ts:14`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | — |
| `text` | `string` | — |
| `level` | `number` | — |

---

## Frontmatter {#frontmatter}
**Tipo:** `interface` | **Ubicación:** `markdown.ts:20`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `title` | `string` | — |
| `description` | `string` | — |
| `layout` | `unknown` | — |
| `hero` | `unknown` | — |
| `features` | `Array` | — |
| `editLink` | `boolean` | — |
| `prev` | `unknown` | — |
| `next` | `unknown` | — |

---

## ParsedMarkdown {#parsedmarkdown}
**Tipo:** `interface` | **Ubicación:** `markdown.ts:45`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `frontmatter` | `Frontmatter` | — |
| `html` | `string` | — |
| `toc` | `unknown` | — |
| `readingTimeMin` | `number` | — |
| `wordCount` | `number` | — |
| `plainText` | `string` | — |

---

## processCodeGroups {#processcodegroups}
**Tipo:** `function` | **Ubicación:** `markdown.ts:173`

Transforms VitePress-style ::: code-group containers into tabbed code blocks

```typescript
function processCodeGroups(markdown: string): string;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `markdown` | `string` | No |

---

## parseMarkdown {#parsemarkdown}
**Tipo:** `function` | **Ubicación:** `markdown.ts:248`

Sin descripción JSDoc proporcionada.

```typescript
function parseMarkdown(rawContent: string): Promise;
```

### Parámetros

| Parámetro | Tipo | Opcional |
| :--- | :--- | :--- |
| `rawContent` | `string` | No |

---

## SearchDocument {#searchdocument}
**Tipo:** `interface` | **Ubicación:** `search.ts:0`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | — |
| `url` | `string` | — |
| `title` | `string` | — |
| `section` | `string` | — |
| `content` | `string` | — |

---

## SearchResult {#searchresult}
**Tipo:** `interface` | **Ubicación:** `search.ts:8`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Tipo | Descripción |
| :--- | :--- | :--- |
| `item` | `SearchDocument` | — |
| `score` | `number` | — |

---

## SearchIndexer {#searchindexer}
**Tipo:** `class` | **Ubicación:** `search.ts:13`

Sin descripción JSDoc proporcionada.

### Propiedades

| Nombre | Visibilidad | Tipo |
| :--- | :--- | :--- |
| `docs` | `private` | `unknown` |

### Métodos

#### `addDocument(doc: SearchDocument): void`

#### `getDocuments(): void`

#### `toJSON(): string`

#### `static fromJSON(jsonStr: string): SearchIndexer`

#### `search(query: string, arg: any): void`

---
