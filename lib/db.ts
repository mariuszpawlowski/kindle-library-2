import fs from 'fs/promises';
import path from 'path';
import { Book, DbSchema } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function ensureDb() {
    try {
        await fs.access(DB_PATH);
    } catch {
        const initialData: DbSchema = { books: [], lastSync: new Date().toISOString() };
        await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    }
}

export async function getDb(): Promise<DbSchema> {
    await ensureDb();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function saveDb(data: DbSchema) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getBooks(): Promise<Book[]> {
    const db = await getDb();
    return db.books;
}

export async function saveBooks(books: Book[]) {
    const db = await getDb();
    db.books = books;
    db.lastSync = new Date().toISOString();
    await saveDb(db);
}

export async function getBook(id: string): Promise<Book | undefined> {
    const db = await getDb();
    return db.books.find((b) => b.id === id);
}

export async function deleteBook(id: string) {
    const db = await getDb();
    db.books = db.books.filter((b) => b.id !== id);
    await saveDb(db);
}

export async function deleteHighlight(bookId: string, highlightId: string) {
    const db = await getDb();
    const book = db.books.find((b) => b.id === bookId);
    if (book) {
        book.highlights = book.highlights.filter((h) => h.id !== highlightId);
        await saveDb(db);
    }
}

export async function updateBookCover(bookId: string, coverUrl: string) {
    const db = await getDb();
    const book = db.books.find((b) => b.id === bookId);
    if (book) {
        book.coverUrl = coverUrl;
        await saveDb(db);
    }
}

// Force rebuild
