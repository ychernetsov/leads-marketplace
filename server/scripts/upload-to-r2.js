require('dotenv/config');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2Private = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_PRIVATE_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_PRIVATE_SECRET_ACCESS_KEY,
  },
});

const r2Public = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_PUBLIC_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_PUBLIC_SECRET_ACCESS_KEY,
  },
});

const dir = path.join(__dirname, 'placeholder-files');
const files = fs.readdirSync(dir);

(async () => {
  for (const file of files) {
    const body = fs.readFileSync(path.join(dir, file));
    const isFullFile = file.includes('_full.');
    const client = isFullFile ? r2Private : r2Public;
    const bucket = isFullFile
      ? process.env.R2_PRIVATE_BUCKET_NAME
      : process.env.R2_PUBLIC_BUCKET_NAME;

    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: file, Body: body }),
    );
    console.log(`Uploaded ${file} → ${isFullFile ? 'private' : 'public'}`);
  }
})();
