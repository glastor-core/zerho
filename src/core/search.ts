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

    const terms = trimmed.split(/\s+/).filter((t) => t.length > 0);
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

      // Check each query term
      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (sectionLower.includes(term)) score += 5;
        if (contentLower.includes(term)) score += 1;
      }

      if (score > 0) {
        scored.push({ item: doc, score });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
