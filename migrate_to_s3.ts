import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { s3Client, BUCKET_NAME } from './lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { DbSchema } from './lib/types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const COVERS_DIR = path.join(process.cwd(), 'public');

async function migrate() {
    if (!fs.existsSync(DB_PATH)) {
        console.error('Local database not found at', DB_PATH);
        return;
    }

    console.log('Reading local database...');
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const db: DbSchema = JSON.parse(data);

    console.log(`Found ${db.books.length} books. Starting migration...`);

    for (const book of db.books) {
        if (book.coverUrl && book.coverUrl.startsWith('/covers/')) {
            const localPath = path.join(COVERS_DIR, book.coverUrl);
            if (fs.existsSync(localPath)) {
                const filename = book.coverUrl.substring(1); // Remove leading slash: covers/abc.jpg
                const buffer = fs.readFileSync(localPath);

                console.log(`Uploading ${filename}...`);

                try {
                    await s3Client.send(new PutObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: filename,
                        Body: buffer,
                        ContentType: 'image/jpeg'
                    }));

                    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
                    book.coverUrl = s3Url;
                } catch (error) {
                    console.error(`Failed to upload ${filename}:`, error);
                }
            } else {
                console.warn(`Local cover file not found: ${localPath}`);
            }
        }
    }

    console.log('Saving updated database to S3...');
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: 'db.json',
            Body: JSON.stringify(db, null, 2),
            ContentType: 'application/json'
        }));
        console.log('Migration complete!');
    } catch (error) {
        console.error('Failed to save DB to S3:', error);
    }
}

migrate().catch(console.error);
