import { NextRequest, NextResponse } from 'next/server';
import { deleteHighlight } from '@/lib/db';

import { checkAuth, unauthorizedResponse } from '@/lib/amplify-server';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!await checkAuth()) return unauthorizedResponse();

    try {
        const { id } = await params;
        const searchParams = req.nextUrl.searchParams;
        const bookId = searchParams.get('bookId');

        if (!bookId) {
            return NextResponse.json({ error: 'Book ID required' }, { status: 400 });
        }

        await deleteHighlight(bookId, id);
        return NextResponse.json({ message: 'Highlight deleted' });
    } catch (error) {
        console.error('Error deleting highlight:', error);
        return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
    }
}
