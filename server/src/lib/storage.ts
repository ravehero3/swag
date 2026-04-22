import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";

// Backblaze B2 (S3-compatible) — used for ZIPs and (legacy) previews/videos
const b2Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_KEY_SECRET!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  forcePathStyle: true,
});

// Cloudflare R2 (S3-compatible) — used for artwork + audio previews (zero egress fees)
const R2_ENABLED = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET
);

const r2Client = R2_ENABLED
  ? new S3Client({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    })
  : null;

export const STORAGE_BUCKETS = {
  PREVIEWS: process.env.B2_PREVIEW_BUCKET!,
  ZIPS: process.env.B2_ZIP_BUCKET!,
  VIDEOS: process.env.B2_VIDEO_BUCKET || process.env.B2_PREVIEW_BUCKET!,
  // Artwork + audio previews route here when R2 is configured; otherwise fall back to B2 previews bucket.
  ARTWORK: R2_ENABLED ? process.env.R2_BUCKET! : process.env.B2_PREVIEW_BUCKET!,
};

export const VIDEO_PREFIX = process.env.B2_VIDEO_BUCKET ? "" : "videos/";

// Pick the right S3 client based on bucket name.
function clientFor(bucket: string): S3Client {
  if (R2_ENABLED && bucket === process.env.R2_BUCKET) return r2Client!;
  return b2Client;
}

// Build a public URL for an object in a known bucket.
export function getPublicUrl(bucket: string, key: string): string {
  if (R2_ENABLED && bucket === process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE_URL) {
    return `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }
  if (process.env.B2_PUBLIC_BASE_URL && bucket === process.env.B2_PREVIEW_BUCKET) {
    return `${process.env.B2_PUBLIC_BASE_URL}/${key}`;
  }
  const endpoint = process.env.B2_ENDPOINT || "";
  return `https://${endpoint}/${bucket}/${key}`;
}

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | string | Readable,
  contentType: string,
) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    const response = await clientFor(bucket).send(command);
    console.log(`File uploaded successfully: ${bucket}/${key}`);
    return response;
  } catch (error) {
    console.error(`Upload error for ${bucket}/${key}:`, error);
    throw error;
  }
}

export async function generatePresignedUploadUrl(
  bucket: string,
  key: string,
  contentType?: string,
  expiresIn: number = 3600
) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(contentType ? { ContentType: contentType } : {}),
    });
    const presignedUrl = await getSignedUrl(clientFor(bucket), command, { expiresIn });
    console.log(`Presigned URL generated for ${bucket}/${key}`);
    return presignedUrl;
  } catch (error) {
    console.error(`Presign error for ${bucket}/${key}:`, error);
    throw error;
  }
}

export async function generateDownloadUrl(bucket: string, key: string, expiresIn: number = 604800) {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(clientFor(bucket), command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Download URL generation error for ${bucket}/${key}:`, error);
    throw error;
  }
}

export async function listFiles(bucket: string, prefix?: string): Promise<{ key: string; size: number; lastModified: Date | undefined }[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: 1000,
    });
    const response = await clientFor(bucket).send(command);
    return (response.Contents || []).map(obj => ({
      key: obj.Key || "",
      size: obj.Size || 0,
      lastModified: obj.LastModified,
    }));
  } catch (error) {
    console.error(`List error for ${bucket}:`, error);
    throw error;
  }
}

export async function configureBucketCors(bucket: string): Promise<void> {
  if (!bucket) return;
  try {
    await clientFor(bucket).send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD", "PUT"],
            AllowedOrigins: ["*"],
            MaxAgeSeconds: 86400,
          },
        ],
      },
    }));
    console.log(`CORS configured for bucket: ${bucket}`);
  } catch (err) {
    console.warn(`CORS setup skipped for ${bucket}:`, (err as Error).message);
  }
}

export const R2_IS_ENABLED = R2_ENABLED;
