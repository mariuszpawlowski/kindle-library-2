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

export interface DbSchema {
  books: Book[];
  lastSync: string;
}
