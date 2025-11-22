import { S3Client } from '@aws-sdk/client-s3';

// Use S3_ prefix to avoid "AWS_" reserved prefix in some deployment platforms (like Amplify)
const REGION = process.env.S3_REGION || process.env.AWS_REGION;
const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;

if (!REGION || !ACCESS_KEY || !SECRET_KEY || !BUCKET) {
    console.warn('Missing AWS/S3 credentials in environment variables. S3 features will not work.');
}

export const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY || '',
        secretAccessKey: SECRET_KEY || '',
    },
});

export const BUCKET_NAME = BUCKET || '';
