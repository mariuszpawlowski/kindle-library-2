import { NextRequest, NextResponse } from 'next/server';
import { parseClippings } from '@/lib/parser';
import { getBooks, saveBooks } from '@/lib/db';
import { fetchCover } from '@/lib/covers';
import { Book } from '@/lib/types';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import https from 'https';
import http from 'http';

function uploadImageToS3(url: string, key: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            if (res.statusCode === 200) {
                const chunks: Uint8Array[] = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', async () => {
                    const buffer = Buffer.concat(chunks);
                    try {
                        await s3Client.send(new PutObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: key,
                            Body: buffer,
                            ContentType: 'image/jpeg',
                            // ACL: 'public-read' // ACLs are often disabled, better to use bucket policy or just rely on public access if configured
                        }));
                        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.S3_REGION || process.env.AWS_REGION}.amazonaws.com/${key}`;
                        resolve(s3Url);
                    } catch (err) {
                        reject(err);
                    }
                });
            } else if (res.statusCode === 301 || res.statusCode === 302) {
                if (res.headers.location) {
                    uploadImageToS3(res.headers.location, key).then(resolve).catch(reject);
                } else {
                    reject(new Error(`Redirect without location: ${res.statusCode}`));
                }
            } else {
                reject(new Error(`Failed to download: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const text = await file.text();
        const parsedBooks = parseClippings(text);
        const existingBooks = await getBooks();

        // Create a map of existing books for faster lookup
        const bookMap = new Map<string, Book>();
        existingBooks.forEach(book => bookMap.set(book.title + book.author, book));

        let newBooksCount = 0;
        let newHighlightsCount = 0;

        for (const parsedBook of parsedBooks) {
            const key = parsedBook.title + parsedBook.author;
            const existingBook = bookMap.get(key);

            if (existingBook) {
                // Merge highlights
                let added = false;
                for (const newHighlight of parsedBook.highlights) {
                    const exists = existingBook.highlights.some(h => h.text === newHighlight.text);
                    if (!exists) {
                        existingBook.highlights.push(newHighlight);
                        newHighlightsCount++;
                        added = true;
                    }
                }
                if (added) {
                    existingBook.lastUpdated = new Date().toISOString();
                }
            } else {
                // New book
                // Fetch cover
                let coverUrl = undefined;
                try {
                    const remoteCoverUrl = await fetchCover(parsedBook.title, parsedBook.author);
                    if (remoteCoverUrl) {
                        const extension = '.jpg';
                        const filename = `covers/${parsedBook.id}${extension}`;

                        coverUrl = await uploadImageToS3(remoteCoverUrl, filename);
                    }
                } catch (error) {
                    console.error(`Failed to fetch/download cover for ${parsedBook.title}:`, error);
                }

                const newBook: Book = {
                    ...parsedBook,
                    coverUrl,
                    lastUpdated: new Date().toISOString(),
                };
                bookMap.set(key, newBook);
                newBooksCount++;
                newHighlightsCount += parsedBook.highlights.length;
            }
        }

        const updatedBooks = Array.from(bookMap.values());
        await saveBooks(updatedBooks);

        return NextResponse.json({
            message: 'Upload successful',
            stats: {
                newBooks: newBooksCount,
                newHighlights: newHighlightsCount,
                totalBooks: updatedBooks.length
            }
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
    }
}
