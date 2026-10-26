export interface SearchDocument {
  id: string;
  url: string;
  title: string;
  section?: string;
  content: string;
}

export interface SearchResult {
  item: SearchDocument;
  score: number;
}

export class SearchIndexer {
  private docs: SearchDocument[] = [];

  addDocument(doc: SearchDocument) {
    this.docs.push(doc);
  }

  getDocuments(): SearchDocument[] {
    return [...this.docs];
  }

  toJSON(): string {
    return JSON.stringify(this.docs, null, 2);
  }

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
