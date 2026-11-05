import type { UploadPurpose } from "@nexora/schemas/media/upload"
import type { SavedFile } from "@nexora/schemas/onboarding/create-organization"
import { completeUpload } from "@/lib/api/media/complete-upload"
import { createUpload } from "@/lib/api/media/create-upload"
import type { ApiResult } from "@/lib/api/result"

export interface UploadedFile {
  /** private/uploads/... key, to send with the form. */
  key: string
  originalFileName: string
  contentType: string
  sizeBytes: number
}

/**
 * Uploads one file from the browser: media-service signs an S3 URL, the
 * browser PUTs the file straight to S3, then media-service checks it.
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose
): Promise<ApiResult<UploadedFile>> {
  const signed = await createUpload({
    purpose,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  })
  if (!signed.success) return signed

  // Upload the file directly to S3 using the signed URL and headers.
  const put = await fetch(signed.data.url, {
    method: signed.data.method,
    headers: signed.data.headers,
    body: file,
  }).catch(() => null)

  if (!put?.ok) {
    return { success: false, code: "MEDIA.UPLOAD_FAILED", status: put?.status }
  }

  const completed = await completeUpload(signed.data.key)
  if (!completed.success) return completed

  return {
    success: true,
    code: completed.code,
    data: {
      key: completed.data.key,
      originalFileName: file.name,
      contentType: completed.data.contentType,
      sizeBytes: completed.data.sizeBytes,
    },
  }
}

/**
 * Uploads a newly picked File. A file saved on an earlier submit was already
 * checked, so it's returned as is and sent again unchanged.
 */
export async function uploadIfNew(
  value: File | SavedFile,
  purpose: UploadPurpose
): Promise<ApiResult<UploadedFile>> {
  if (value instanceof File) return uploadFile(value, purpose)
  return { success: true, code: "MEDIA.FILE.KEPT", data: value }
}
