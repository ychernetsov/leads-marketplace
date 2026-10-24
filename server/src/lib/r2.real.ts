import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

export const privateR2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_PRIVATE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_PRIVATE_SECRET_ACCESS_KEY!,
  },
});

export const publicR2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_PUBLIC_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_PUBLIC_SECRET_ACCESS_KEY!,
  },
});

export const PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET_NAME!;
export const PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET_NAME!;
export const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL!;

export async function getSignedUploadUrl(key: string, expiresInSeconds = 900) {
  const command = new PutObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key });
  return getSignedUrl(privateR2, command, { expiresIn: expiresInSeconds });
}

export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds: number,
) {
  const command = new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key });
  return getSignedUrl(privateR2, command, { expiresIn: expiresInSeconds });
}

export async function getPrivateObjectBuffer(key: string): Promise<Buffer> {
  const res = await privateR2.send(
    new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }),
  );
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function getPrivateObjectSize(key: string): Promise<number> {
  const res = await privateR2.send(
    new HeadObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }),
  );
  return res.ContentLength ?? 0;
}

export async function uploadPublicSample(key: string, body: Buffer) {
  await publicR2.send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'text/csv',
    }),
  );
}

export function getPublicSampleUrl(key: string) {
  return `${PUBLIC_BASE_URL}/${key}`;
}
