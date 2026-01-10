import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: "us-east-1", // B2 uses this for S3 compatibility
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_KEY_SECRET!,
  },
});

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string,
  isPublic: boolean = false
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: isPublic ? "public-read" : "private",
  });

  return s3Client.send(command);
}

export async function generateDownloadUrl(bucket: string, key: string, expiresIn: number = 604800) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export const STORAGE_BUCKETS = {
  PREVIEWS: process.env.B2_PREVIEW_BUCKET!,
  ZIPS: process.env.B2_ZIP_BUCKET!,
};
