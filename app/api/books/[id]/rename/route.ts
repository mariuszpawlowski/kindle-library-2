import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { RenamedItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { newTitle, newAuthor } = await req.json();

        if (!newTitle || !newAuthor) {
            return NextResponse.json(
                { error: 'New title and author are required' },
                { status: 400 }
            );
        }

        const db = await getDb();
        const book = db.books.find((b) => b.id === id);

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const oldTitle = book.title;
        const oldAuthor = book.author;

        // Check if actually changed
        if (oldTitle === newTitle && oldAuthor === newAuthor) {
            return NextResponse.json({ message: 'No changes made' });
        }

        // Initialize aliases if needed
        if (!book.aliases) {
            book.aliases = [];
        }

        // Add current name to aliases if not already there
        const aliasExists = book.aliases.some(
            (a) => a.title === oldTitle && a.author === oldAuthor
        );
        if (!aliasExists) {
            book.aliases.push({ title: oldTitle, author: oldAuthor });
        }

        // Update book details
        book.title = newTitle;
        book.author = newAuthor;
        book.lastUpdated = new Date().toISOString();

        // Add to history
        if (!db.history) {
            db.history = [];
        }

        const renamedItem: RenamedItem = {
            id: uuidv4(),
            type: 'rename',
            bookId: book.id,
            oldTitle,
            oldAuthor,
            newTitle,
            newAuthor,
            date: new Date().toISOString(),
        };

        db.history.push(renamedItem);

        await saveDb(db);

        return NextResponse.json({ message: 'Book renamed successfully', book });
    } catch (error) {
        console.error('Rename error:', error);
        return NextResponse.json(
            { error: 'Failed to rename book' },
            { status: 500 }
        );
    }
}
