import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
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

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string,
) {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Note: For public buckets, ACL is not needed, but for direct browser uploads,
      // the bucket needs CORS configured in Backblaze
    });

    const response = await s3Client.send(command);
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
      // IMPORTANT:
      // Do NOT always sign ContentType. Browsers sometimes send a slightly different
      // Content-Type than what we expect (or omit it), which can invalidate the signature.
      // Leaving it unsigned makes uploads more reliable.
      ...(contentType ? { ContentType: contentType } : {}),
    });
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    console.log(`Presigned URL generated for ${bucket}/${key}`);
    return presignedUrl;
  } catch (error) {
    console.error(`Presign error for ${bucket}/${key}:`, error);
    throw error;
  }
}

export async function generateDownloadUrl(bucket: string, key: string, expiresIn: number = 604800) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error(`Download URL generation error for ${bucket}/${key}:`, error);
    throw error;
  }
}

export const STORAGE_BUCKETS = {
  PREVIEWS: process.env.B2_PREVIEW_BUCKET!,
  ZIPS: process.env.B2_ZIP_BUCKET!,
};
