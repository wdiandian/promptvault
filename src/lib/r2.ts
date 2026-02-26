import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${import.meta.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: import.meta.env.R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));
  return `${import.meta.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string) {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({
    Bucket: import.meta.env.R2_BUCKET_NAME,
    Key: key,
  }));
}
