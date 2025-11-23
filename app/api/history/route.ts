import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const history = await getHistory();
        // Sort by deletedAt desc
        history.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        return NextResponse.json(history);
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
