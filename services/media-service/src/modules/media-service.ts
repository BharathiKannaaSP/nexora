import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner"
import { fileTypeFromBuffer } from "file-type"
import { randomUUID } from "node:crypto"
import { AppError } from "@nexora/shared/express/app-error"
import type {
  CompleteUploadResponseData,
  CreateUploadResponseData,
  FileUrlResponseData,
} from "@nexora/shared/types/media"
import {
  EXTENSION_BY_MIME,
  UPLOAD_PURPOSES,
  UPLOAD_RULES,
  parseUploadKey,
  type CreateUploadInput,
  type SignFileUrlInput,
  type UploadPurpose,
} from "@nexora/schemas/media/upload"
import { env } from "../config/media-env"
import { s3 } from "../lib/s3-client"
import {
  canSignCloudFrontUrls,
  signCloudFrontUrl,
  windowedExpiry,
} from "../lib/cloudfront"

// tmp/{userId}/{purpose}/{uuid}.{ext}, exactly as createUploadService builds it.
const TMP_KEY = /^tmp\/([A-Za-z0-9_-]+)\/([a-z-]+)\/[0-9a-f-]{36}\.[a-z]+$/

const SAFE_ID = /^[A-Za-z0-9_-]+$/

// Enough leading bytes for file-type to recognize every allowed format.
const SNIFF_BYTES = 4100

// file-type reports old .doc files by their container format.
const SNIFFED_MIME_ALIASES: Record<string, string> = {
  "application/x-cfb": "application/msword",
}

// Images: the browser keeps them for one signed-URL window, CloudFront for a
// day. Caching at the edge is safe: CloudFront checks the signature on every
// request before it looks in its cache.
const IMAGE_CACHE = "max-age=300, s-maxage=86400"
// Documents: never cached anywhere.
const DOCUMENT_CACHE = "private, no-store"

const forbidden = () => new AppError("Forbidden", 403, "FORBIDDEN")

const assertSafeUserId = (userId: string) => {
  if (!SAFE_ID.test(userId)) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
  }
}

const isUploadPurpose = (value: string): value is UploadPurpose =>
  (UPLOAD_PURPOSES as readonly string[]).includes(value)

const objectHeaders = (purpose: UploadPurpose) =>
  UPLOAD_RULES[purpose].kind === "image"
    ? { CacheControl: IMAGE_CACHE, ContentDisposition: "inline" }
    : { CacheControl: DOCUMENT_CACHE, ContentDisposition: "attachment" }

const deleteObject = (key: string) =>
  s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))

const headSize = async (key: string) => {
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
    )
    return head.ContentLength ?? 0
  } catch (error) {
    if (error instanceof NotFound) {
      throw new AppError("File not found or expired", 404, "MEDIA.UPLOAD_NOT_FOUND")
    }
    throw error
  }
}

/** The type from the file's first bytes, not its name or claimed type. */
const sniffContentType = async (key: string) => {
  const start = await s3.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Range: `bytes=0-${SNIFF_BYTES - 1}`,
    })
  )
  const bytes = await start.Body?.transformToByteArray()
  const sniffed = bytes ? await fileTypeFromBuffer(bytes) : undefined

  return sniffed ? (SNIFFED_MIME_ALIASES[sniffed.mime] ?? sniffed.mime) : null
}

/** Deletes the rejected upload so it doesn't wait for the tmp/ lifecycle rule. */
const rejectUpload = async (key: string, message: string, code: string) => {
  await deleteObject(key)
  throw new AppError(message, 400, code)
}

/** Only checked uploads; refuses tmp/ and anything else. */
const assertUploadKey = (key: string) => {
  if (!parseUploadKey(key)) throw forbidden()
}

// ---------------------------------------------------------------------------
// Public routes: the uploader's own files only.
// ---------------------------------------------------------------------------

export const createUploadService = async (
  userId: string,
  input: CreateUploadInput
): Promise<CreateUploadResponseData> => {
  assertSafeUserId(userId)

  const rule = UPLOAD_RULES[input.purpose]
  const ext = EXTENSION_BY_MIME[input.contentType]

  if (!ext || !rule.mimeTypes.includes(input.contentType)) {
    throw new AppError(
      "This file type is not allowed",
      400,
      "MEDIA.UNSUPPORTED_TYPE"
    )
  }
  if (input.sizeBytes > rule.maxBytes) {
    throw new AppError("This file is too large", 400, "MEDIA.FILE_TOO_LARGE")
  }

  // The server picks the key; the user's file name is never part of it.
  const key = `tmp/${userId}/${input.purpose}/${randomUUID()}.${ext}`

  const url = await getS3SignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: input.contentType,
    }),
    {
      expiresIn: env.S3_UPLOAD_URL_TTL_SECONDS,
      // Signs Content-Type into the URL, so S3 rejects a PUT with any other.
      signableHeaders: new Set(["content-type"]),
    }
  )

  return {
    key,
    url,
    method: "PUT",
    headers: { "Content-Type": input.contentType },
    expiresInSeconds: env.S3_UPLOAD_URL_TTL_SECONDS,
  }
}

/**
 * Re-checks the real size and type (a presigned PUT enforces neither), then
 * moves the file to private/uploads/{userId}/{purpose}/. The returned details
 * go with the form; the owning service stores them.
 */
export const completeUploadService = async (
  userId: string,
  key: string
): Promise<CompleteUploadResponseData> => {
  assertSafeUserId(userId)

  const [, keyUserId, purpose] = TMP_KEY.exec(key) ?? []
  if (keyUserId !== userId || !purpose || !isUploadPurpose(purpose)) {
    throw forbidden()
  }

  const rule = UPLOAD_RULES[purpose]
  const sizeBytes = await headSize(key)

  if (sizeBytes === 0 || sizeBytes > rule.maxBytes) {
    return rejectUpload(key, "This file is too large", "MEDIA.FILE_TOO_LARGE")
  }

  const contentType = await sniffContentType(key)
  const ext = contentType ? EXTENSION_BY_MIME[contentType] : undefined

  if (!contentType || !ext || !rule.mimeTypes.includes(contentType)) {
    return rejectUpload(
      key,
      "This file type is not allowed",
      "MEDIA.UNSUPPORTED_TYPE"
    )
  }

  const uploadKey = `private/uploads/${userId}/${purpose}/${randomUUID()}.${ext}`

  await s3.send(
    new CopyObjectCommand({
      Bucket: env.S3_BUCKET,
      CopySource: `${env.S3_BUCKET}/${key}`,
      Key: uploadKey,
      MetadataDirective: "REPLACE",
      ContentType: contentType,
      ...objectHeaders(purpose),
    })
  )
  await deleteObject(key)

  return { key: uploadKey, contentType, sizeBytes, purpose }
}

const assertOwnUpload = (userId: string, key: string) => {
  assertSafeUserId(userId)
  if (parseUploadKey(key)?.userId !== userId) throw forbidden()
}

/**
 * One of the user's own uploads, e.g. before the form is submitted: inline
 * for previews, or as a download named `fileName`.
 */
export const getOwnUploadUrlService = (
  userId: string,
  key: string,
  fileName?: string
) => {
  assertOwnUpload(userId, key)
  return signUrl(key, fileName)
}

/**
 * Removes one of the user's own uploads (e.g. they picked a different file).
 * Only for files no record uses yet: the record would point at nothing.
 */
export const deleteOwnUploadService = async (userId: string, key: string) => {
  assertOwnUpload(userId, key)
  await deleteObject(key)
  return { objectKey: key }
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

/**
 * filename= takes ASCII only and must not break out of its quotes;
 * filename* carries the real (possibly non-English) name.
 */
const contentDispositionFor = (fileName: string) => {
  const asciiName = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_")
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

/** CloudFront signed URL, or an S3 presigned GET when no key pair is set. */
const signUrl = async (
  key: string,
  fileName?: string
): Promise<FileUrlResponseData> => {
  const { expiresAt, expiresInSeconds } = windowedExpiry(
    env.DOWNLOAD_URL_TTL_SECONDS
  )
  const disposition = fileName ? contentDispositionFor(fileName) : undefined

  if (canSignCloudFrontUrls) {
    const url = signCloudFrontUrl(
      key,
      expiresAt,
      disposition ? { "response-content-disposition": disposition } : undefined
    )
    return { url, expiresInSeconds }
  }

  const url = await getS3SignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: disposition,
    }),
    { expiresIn: expiresInSeconds }
  )
  return { url, expiresInSeconds }
}

// ---------------------------------------------------------------------------
// Internal routes: the calling service has already checked access.
// ---------------------------------------------------------------------------

export const signFileUrlService = async (
  input: SignFileUrlInput
): Promise<FileUrlResponseData> => {
  assertUploadKey(input.key)
  return signUrl(input.key, input.fileName)
}

/** Many at once, for list pages (e.g. member avatars). */
export const signFileUrlsService = async (keys: string[]) => {
  const unique = [...new Set(keys)]
  const entries = await Promise.all(
    unique.map(async (key) => [key, await signFileUrlService({ key })] as const)
  )
  return { urls: Object.fromEntries(entries) }
}

export const deleteFileService = async (key: string) => {
  assertUploadKey(key)

  await deleteObject(key)
  return { objectKey: key }
}
