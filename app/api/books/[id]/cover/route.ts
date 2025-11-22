import { NextRequest, NextResponse } from 'next/server';
import { updateBookCover } from '@/lib/db';
import { s3Client, BUCKET_NAME } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        const filename = `covers/${id}-${uuidv4()}${extension}`; // Add uuid to bust cache

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: file.type
        }));

        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

        await updateBookCover(id, s3Url);

        return NextResponse.json({ message: 'Cover updated', coverUrl: s3Url });
    } catch (error) {
        console.error('Cover upload error:', error);
        return NextResponse.json({ error: 'Failed to update cover' }, { status: 500 });
    }
}
