export interface SearchDocument {
  id: string;
  url: string;
  title: string;
  section?: string;
  content: string;
}

export class SearchIndexer {
  private docs: SearchDocument[] = [];

  addDocument(doc: SearchDocument) {
    this.docs.push(doc);
  }

  toJSON(): string {
    return JSON.stringify(this.docs);
  }
}
