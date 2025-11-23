export interface Highlight {
  id: string;
  text: string;
  location?: string;
  page?: string;
  dateAdded: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  highlights: Highlight[];
  lastUpdated: string;
}

export interface DeletedItem {
  id: string;
  type: 'book' | 'highlight';
  originalId: string;
  data: Book | Highlight;
  deletedAt: string;
  bookId?: string; // For highlights
  title?: string; // Metadata for smart import
  author?: string; // Metadata for smart import
  text?: string; // Metadata for smart import
}

export interface DbSchema {
  books: Book[];
  history: DeletedItem[];
  lastSync: string;
}
