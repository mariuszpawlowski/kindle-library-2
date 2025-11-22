import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const vars = {
        S3_REGION: process.env.S3_REGION ? 'Set' : 'Missing',
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'Set' : 'Missing',
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ? 'Set' : 'Missing',
        // Check legacy AWS_ prefix too just in case
        AWS_REGION: process.env.AWS_REGION ? 'Set' : 'Missing',
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
        AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME ? 'Set' : 'Missing',

        // Check what lib/s3.ts would resolve to
        RESOLVED_REGION: process.env.S3_REGION || process.env.AWS_REGION || 'Missing',
        RESOLVED_BUCKET: process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || 'Missing',
    };

    return NextResponse.json(vars);
}
