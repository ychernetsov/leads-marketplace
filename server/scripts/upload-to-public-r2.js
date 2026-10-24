require('dotenv/config');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

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
    if (!file.includes('_sample.')) continue;
    await r2Public.send(
      new PutObjectCommand({
        Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
        Key: file,
        Body: body,
      }),
    );
    console.log(`Uploaded ${file} → public`);
  }
})();
