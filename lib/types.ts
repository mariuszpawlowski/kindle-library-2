export interface Highlight {
  id: string;
  text: string;
  location?: string;
  page?: string;
  dateAdded: string;
}

export interface BookAlias {
  title: string;
  author: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  highlights: Highlight[];
  lastUpdated: string;
  aliases?: BookAlias[];
}

export interface RenamedItem {
  id: string;
  type: 'rename';
  bookId: string;
  oldTitle: string;
  oldAuthor: string;
  newTitle: string;
  newAuthor: string;
  date: string;
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
  history: (DeletedItem | RenamedItem)[];
  lastSync: string;
}
