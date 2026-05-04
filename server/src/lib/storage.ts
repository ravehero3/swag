import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";

const envTrim = (v: string | undefined) => (v == null ? v : v.trim());

// Cloudflare R2 credentials
const R2_ACCOUNT_ID = envTrim(process.env.R2_ACCOUNT_ID);
const R2_ACCESS_KEY_ID = envTrim(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = envTrim(process.env.R2_SECRET_ACCESS_KEY);
const R2_PUBLIC_BASE_URL = envTrim(process.env.R2_PUBLIC_BASE_URL);

// R2 bucket names (can be the same bucket with different key prefixes, or separate buckets)
const R2_PREVIEW_BUCKET = envTrim(process.env.R2_PREVIEW_BUCKET);
const R2_ZIP_BUCKET = envTrim(process.env.R2_ZIP_BUCKET);
const R2_ARTWORK_BUCKET = envTrim(process.env.R2_ARTWORK_BUCKET);
// Legacy single-bucket env var (used as fallback for all types)
const R2_BUCKET = envTrim(process.env.R2_BUCKET);

// Backblaze B2 credentials (kept as fallback)
const B2_ENDPOINT = envTrim(process.env.B2_ENDPOINT);
const B2_KEY_ID = envTrim(process.env.B2_KEY_ID);
const B2_KEY_SECRET = envTrim(process.env.B2_KEY_SECRET);
const B2_PREVIEW_BUCKET = envTrim(process.env.B2_PREVIEW_BUCKET);
const B2_ZIP_BUCKET = envTrim(process.env.B2_ZIP_BUCKET);
const B2_VIDEO_BUCKET = envTrim(process.env.B2_VIDEO_BUCKET);
const B2_PUBLIC_BASE_URL = envTrim(process.env.B2_PUBLIC_BASE_URL);

export const R2_IS_ENABLED = !!(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  (R2_PREVIEW_BUCKET || R2_BUCKET)
);

// Cloudflare R2 client
const r2Client = R2_IS_ENABLED
  ? new S3Client({
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: "auto",
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    })
  : null;

// Backblaze B2 client (fallback)
const b2Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: B2_KEY_ID!,
    secretAccessKey: B2_KEY_SECRET!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  forcePathStyle: true,
});

// Resolved bucket names — R2 takes priority over B2
const resolvedPreviewBucket = R2_IS_ENABLED
  ? (R2_PREVIEW_BUCKET || R2_BUCKET)!
  : B2_PREVIEW_BUCKET!;

const resolvedZipBucket = R2_IS_ENABLED
  ? (R2_ZIP_BUCKET || R2_BUCKET)!
  : B2_ZIP_BUCKET!;

const resolvedArtworkBucket = R2_IS_ENABLED
  ? (R2_ARTWORK_BUCKET || R2_PREVIEW_BUCKET || R2_BUCKET)!
  : B2_PREVIEW_BUCKET!;

const resolvedVideoBucket = R2_IS_ENABLED
  ? (R2_PREVIEW_BUCKET || R2_BUCKET)!
  : (B2_VIDEO_BUCKET || B2_PREVIEW_BUCKET)!;

export const STORAGE_BUCKETS = {
  PREVIEWS: resolvedPreviewBucket,
  ZIPS: resolvedZipBucket,
  ARTWORK: resolvedArtworkBucket,
  VIDEOS: resolvedVideoBucket,
};

export const VIDEO_PREFIX = (!R2_IS_ENABLED && !B2_VIDEO_BUCKET) ? "videos/" : "";

// Set of R2 bucket names for routing decisions
const r2Buckets = new Set([
  R2_PREVIEW_BUCKET,
  R2_ZIP_BUCKET,
  R2_ARTWORK_BUCKET,
  R2_BUCKET,
].filter(Boolean));

function isR2Bucket(bucket: string): boolean {
  return R2_IS_ENABLED && r2Buckets.has(bucket);
}

function clientFor(bucket: string): S3Client {
  return isR2Bucket(bucket) ? r2Client! : b2Client;
}

// Build a public URL for an object in a known bucket.
export function getPublicUrl(bucket: string, key: string): string {
  if (isR2Bucket(bucket)) {
    if (R2_PUBLIC_BASE_URL) {
      return `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    }
    throw new Error(
      "R2_PUBLIC_BASE_URL is not set. Configure your Cloudflare R2 public dev URL " +
      "(https://pub-<hash>.r2.dev) or a custom domain bound to the bucket."
    );
  }
  if (B2_PUBLIC_BASE_URL && bucket === B2_PREVIEW_BUCKET) {
    return `${B2_PUBLIC_BASE_URL}/${key}`;
  }
  return `https://${B2_ENDPOINT || ""}/${bucket}/${key}`;
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
