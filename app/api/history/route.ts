import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const history = await getHistory();
        // Sort by date/deletedAt desc
        history.sort((a, b) => {
            const dateA = a.type === 'rename' ? a.date : a.deletedAt;
            const dateB = b.type === 'rename' ? b.date : b.deletedAt;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        return NextResponse.json(history);
    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
