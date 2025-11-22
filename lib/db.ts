import { Book, DbSchema } from './types';
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
            const initialData: DbSchema = { books: [], lastSync: new Date().toISOString() };
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
    } catch (error) {
        console.error('Error reading DB from S3:', error);
        // Fallback to empty DB on error to prevent crash, but log it
        return { books: [], lastSync: new Date().toISOString() };
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
