import { NextRequest, NextResponse } from 'next/server';
import { restoreItem } from '@/lib/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await restoreItem(id);
        return NextResponse.json({ message: 'Item restored' });
    } catch (error) {
        console.error('Restore API Error:', error);
        return NextResponse.json({ error: 'Failed to restore item' }, { status: 500 });
    }
}
