/** Represents an indexed document item in the Zerho client-side search engine. */
export interface SearchDocument {
  /** Unique document identifier hash or slug */
  id: string;
  /** Canonical link URL */
  url: string;
  /** Primary document or section title */
  title: string;
  /** Sub-section heading title if applicable */
  section?: string;
  /** Plain text content indexed for term matching */
  content: string;
}

/** Represents a weighted search query hit returned by the search engine. */
export interface SearchResult {
  /** The matching search document */
  item: SearchDocument;
  /** Relevance score calculated by exact and partial term matches */
  score: number;
}

const STOP_WORDS = new Set([
  "de",
  "la",
  "el",
  "en",
  "un",
  "es",
  "al",
  "lo",
  "se",
  "su",
  "mi",
  "tu",
  "por",
  "con",
  "del",
  "las",
  "los",
  "una",
  "para",
  "como",
  "cómo",
  "que",
  "qué",
  "in",
  "on",
  "at",
  "to",
  "of",
  "is",
  "it",
  "or",
  "an",
  "as",
  "by",
  "the",
  "and",
  "for",
  "how",
]);

/** Semantic concept clusters for natural-language synonym expansion in Spanish and English */
const SEMANTIC_CLUSTERS: string[][] = [
  [
    "puerto",
    "port",
    "exponer",
    "expongo",
    "escuchar",
    "listen",
    "red",
    "network",
    "http",
    "serve",
    "servidor",
    "server",
  ],
  [
    "desplegar",
    "despliegue",
    "deploy",
    "deployment",
    "publicar",
    "produccion",
    "producción",
    "nube",
    "cloud",
    "cloudflare",
    "edge",
    "hosting",
  ],
  [
    "ejecutar",
    "correr",
    "probar",
    "sandbox",
    "playground",
    "consola",
    "monaco",
    "interactivo",
    "worker",
  ],
  [
    "ia",
    "ai",
    "llm",
    "llms",
    "llms.txt",
    "rag",
    "agente",
    "agentes",
    "semantica",
    "semántica",
  ],
  [
    "api",
    "rest",
    "openapi",
    "swagger",
    "endpoint",
    "endpoints",
    "peticion",
    "request",
    "curl",
  ],
  [
    "tema",
    "theme",
    "oscuro",
    "dark",
    "claro",
    "light",
    "estilos",
    "colores",
    "css",
    "diseño",
  ],
];

/**
 * Expands primary query terms with semantically related domain synonyms.
 * @param primaryTerms Cleaned user query terms
 * @returns Array of semantically related expansion terms not already in primaryTerms
 */
export function expandSemanticTerms(primaryTerms: string[]): string[] {
  const primarySet = new Set(primaryTerms);
  const expanded = new Set<string>();

  for (const rawTerm of primaryTerms) {
    const clean = rawTerm.replace(/[¿?¡!.,;:()"']/g, "");
    if (!clean) continue;
    for (const cluster of SEMANTIC_CLUSTERS) {
      if (cluster.some((word) => word === clean || (clean.length >= 4 && word.startsWith(clean)))) {
        for (const synonym of cluster) {
          if (!primarySet.has(synonym)) {
            expanded.add(synonym);
          }
        }
      }
    }
  }

  return Array.from(expanded);
}

/** In-memory client-side and server-side search indexer and query ranking engine. */
export class SearchIndexer {
  private docs: SearchDocument[] = [];

  /**
   * Adds a document to the search index collection.
   * @param doc Search document to index
   */
  addDocument(doc: SearchDocument) {
    this.docs.push(doc);
  }

  /**
   * Returns a copy of all currently indexed documents.
   * @returns Array of indexed search documents
   */
  getDocuments(): SearchDocument[] {
    return [...this.docs];
  }

  /**
   * Serializes the search index into formatted JSON for client download.
   * @returns Formatted JSON string of indexed documents
   */
  toJSON(): string {
    return JSON.stringify(this.docs, null, 2);
  }

  /**
   * Reconstructs a SearchIndexer instance from serialized JSON.
   * @param jsonStr Serialized JSON documents array
   * @returns Populated SearchIndexer instance
   */
  static fromJSON(jsonStr: string): SearchIndexer {
    const indexer = new SearchIndexer();
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        for (const doc of parsed) {
          if (doc && doc.id && doc.url && doc.title) {
            indexer.addDocument(doc);
          }
        }
      }
    } catch (_e) {
      console.warn("Failed to parse search index JSON");
    }
    return indexer;
  }

  /**
   * Executes a weighted multi-term search query across titles, sections, and bodies.
   * @param query Search keywords or phrase
   * @param limit Maximum number of ranked results to return
   * @returns Ranked array of matching search results
   */
  search(query: string, limit = 10): SearchResult[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const rawTerms = trimmed
      .replace(/[¿?¡!.,;:()"']/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 0);
    const filteredTerms = rawTerms.filter((t) => !STOP_WORDS.has(t));
    const terms = filteredTerms.length > 0 ? filteredTerms : rawTerms;
    const semanticSynonyms = expandSemanticTerms(terms);
    const scored: SearchResult[] = [];

    for (const doc of this.docs) {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const sectionLower = (doc.section || "").toLowerCase();
      const contentLower = doc.content.toLowerCase();

      // Exact title match bonus
      if (titleLower === trimmed) {
        score += 100;
      } else if (titleLower.includes(trimmed)) {
        score += 30;
      }

      // Check each primary query term
      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (sectionLower.includes(term)) score += 5;
        if (contentLower.includes(term)) score += 1;
      }

      // Check semantic expansion terms (lower weight so literal hits always rank first)
      for (const syn of semanticSynonyms) {
        if (titleLower.includes(syn)) score += 3;
        if (sectionLower.includes(syn)) score += 1.5;
        if (contentLower.includes(syn)) score += 0.5;
      }

      if (score > 0) {
        scored.push({ item: doc, score });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
