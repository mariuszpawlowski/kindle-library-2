import { NextRequest, NextResponse } from 'next/server';
import { deleteHighlight } from '@/lib/db';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const bookId = searchParams.get('bookId');

    if (!bookId) {
        return NextResponse.json({ error: 'Book ID required' }, { status: 400 });
    }

    await deleteHighlight(bookId, id);
    return NextResponse.json({ message: 'Highlight deleted' });
}
