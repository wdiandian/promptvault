import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${import.meta.env.R2_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: import.meta.env.R2_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY ?? process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

function getBucket() {
  return import.meta.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET_NAME!;
}

function getPublicUrl() {
  return import.meta.env.R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL!;
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });
  return getSignedUrl(client, command, {
    expiresIn: 600,
    unhoistableHeaders: new Set(['x-amz-checksum-crc32']),
  });
}

export function getPublicFileUrl(key: string): string {
  return `${getPublicUrl()}/${key}`;
}

export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: file,
    ContentType: contentType,
  }));
  return `${getPublicUrl()}/${key}`;
}

export async function deleteFromR2(key: string) {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  }));
}
