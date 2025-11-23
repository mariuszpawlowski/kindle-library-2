import { Book, DbSchema, DeletedItem, Highlight } from './types';
import { s3Client, BUCKET_NAME } from './s3';
import { GetObjectCommand, PutObjectCommand, HeadObjectCommand, NotFound } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const DB_KEY = 'db.json';

async function streamToString(stream: Readable): Promise<string> {
    return await new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}

async function ensureDb() {
    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: DB_KEY }));
    } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            const initialData: DbSchema = { books: [], history: [], lastSync: new Date().toISOString() };
            await saveDb(initialData);
        } else {
            throw error;
        }
    }
}

export async function getDb(): Promise<DbSchema> {
    await ensureDb();
    try {
        const response = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: DB_KEY }));
        if (!response.Body) {
            throw new Error('Empty response body from S3');
        }
        const str = await response.Body.transformToString();
        return JSON.parse(str);
    } catch (error: any) {
        // Only return empty DB if the file truly doesn't exist
        if (error.name === 'NoSuchKey' || error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return { books: [], history: [], lastSync: new Date().toISOString() };
        }
        console.error('Error reading DB from S3:', error);
        throw error;
    }
}

export async function saveDb(data: DbSchema) {
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: DB_KEY,
            Body: JSON.stringify(data, null, 2),
            ContentType: 'application/json'
        }));
    } catch (error) {
        console.error('Error saving DB to S3:', error);
        throw error;
    }
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
    const book = db.books.find((b) => b.id === id);
    if (book) {
        if (!db.history) db.history = [];

        const deletedItem: DeletedItem = {
            id: require('uuid').v4(),
            type: 'book',
            originalId: book.id,
            data: book,
            deletedAt: new Date().toISOString(),
            title: book.title,
            author: book.author
        };

        db.history.push(deletedItem);
        db.books = db.books.filter((b) => b.id !== id);
        await saveDb(db);
    }
}

export async function deleteHighlight(bookId: string, highlightId: string) {
    const db = await getDb();
    const book = db.books.find((b) => b.id === bookId);
    if (book) {
        const highlight = book.highlights.find((h) => h.id === highlightId);
        if (highlight) {
            if (!db.history) db.history = [];

            const deletedItem: DeletedItem = {
                id: require('uuid').v4(),
                type: 'highlight',
                originalId: highlight.id,
                data: highlight,
                deletedAt: new Date().toISOString(),
                bookId: book.id,
                text: highlight.text
            };

            db.history.push(deletedItem);
            book.highlights = book.highlights.filter((h) => h.id !== highlightId);
            await saveDb(db);
        }
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

export async function getHistory(): Promise<DeletedItem[]> {
    // Fetch history from DB
    const db = await getDb();
    return db.history || [];
}

export async function restoreItem(id: string) {
    const db = await getDb();
    const itemIndex = (db.history || []).findIndex((h) => h.id === id);
    if (itemIndex === -1) return;

    const item = db.history[itemIndex];

    if (item.type === 'book') {
        const book = item.data as Book;
        // Check if book already exists (maybe re-imported?)
        if (!db.books.find(b => b.id === book.id)) {
            db.books.push(book);
        }
    } else if (item.type === 'highlight') {
        const highlight = item.data as Highlight;
        const book = db.books.find(b => b.id === item.bookId);
        if (book) {
            // Check if highlight already exists
            if (!book.highlights.find(h => h.id === highlight.id)) {
                book.highlights.push(highlight);
            }
        } else {
            // Parent book missing, cannot restore highlight easily without book
            // For now, we ignore or could try to find book by title/author if we had it
            console.warn('Cannot restore highlight, parent book not found');
            return;
        }
    }

    // Remove from history
    db.history.splice(itemIndex, 1);
    await saveDb(db);
}
