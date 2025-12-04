import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID ? 'Set' : 'Missing',
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ? 'Set' : 'Missing',
        NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ? 'Set' : 'Missing',
        S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ? 'Set' : 'Missing',
        NODE_ENV: process.env.NODE_ENV,
    });
}
