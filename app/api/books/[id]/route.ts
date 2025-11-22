import { NextRequest, NextResponse } from 'next/server';
import { getBook, deleteBook } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const book = await getBook(id);
    if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    return NextResponse.json(book);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await deleteBook(id);
    return NextResponse.json({ message: 'Book deleted' });
}
