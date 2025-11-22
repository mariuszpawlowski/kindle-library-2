import { NextRequest, NextResponse } from 'next/server';
import { updateBookCover } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');

if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const extension = path.extname(file.name) || '.jpg';
        const filename = `${id}-${uuidv4()}${extension}`; // Add uuid to bust cache
        const localPath = `/covers/${filename}`;
        const fullPath = path.join(COVERS_DIR, filename);

        fs.writeFileSync(fullPath, buffer);

        await updateBookCover(id, localPath);

        return NextResponse.json({ message: 'Cover updated', coverUrl: localPath });
    } catch (error) {
        console.error('Cover upload error:', error);
        return NextResponse.json({ error: 'Failed to update cover' }, { status: 500 });
    }
}
