import { NextResponse } from 'next/server';
import { getBooks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const books = await getBooks();
        // Sort by last updated desc
        books.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        return NextResponse.json(books);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }
}
