import type {
  FileUrlResponseData,
  FileUrlsResponseData,
} from "@nexora/shared/types/media"

import { fetchFromService } from "./service-client"

/** media-service signs at most this many keys per call. */
const MAX_KEYS_PER_CALL = 100

/**
 * CloudFront signed URLs for private S3 keys (e.g. avatars), by key. Images
 * are extra: a key that fails to sign is left out and the UI falls back
 * (e.g. to initials), rather than failing the response.
 */
export const signFileUrls = async (
  callerId: string,
  keys: (string | null | undefined)[]
): Promise<Map<string, string>> => {
  const unique = [...new Set(keys.filter((key): key is string => !!key))]
  const urls = new Map<string, string>()
  if (unique.length === 0) return urls

  const batches = Array.from(
    { length: Math.ceil(unique.length / MAX_KEYS_PER_CALL) },
    (_, i) => unique.slice(i * MAX_KEYS_PER_CALL, (i + 1) * MAX_KEYS_PER_CALL)
  )

  const results = await Promise.allSettled(
    batches.map((batch) =>
      fetchFromService<FileUrlsResponseData>(
        "media",
        "/internal/v1/files/urls",
        callerId,
        { method: "POST", body: { keys: batch } }
      )
    )
  )

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Aggregate service: signing file URLs failed", result.reason)
      continue
    }
    for (const [key, { url }] of Object.entries(result.value.urls)) {
      urls.set(key, url)
    }
  }
  return urls
}

/**
 * View and download URLs for private files, by key: one inline, one as an
 * attachment named after the file. A file that fails to sign is left out.
 */
export const signFileViewAndDownloadUrls = async (
  callerId: string,
  files: { key: string; fileName: string }[]
): Promise<Map<string, { viewUrl: string; downloadUrl: string }>> => {
  const unique = [...new Map(files.map((file) => [file.key, file])).values()]

  const results = await Promise.allSettled(
    unique.map(async ({ key, fileName }) => {
      const [view, download] = await Promise.all([
        fetchFromService<FileUrlResponseData>(
          "media",
          "/internal/v1/files/url",
          callerId,
          { method: "POST", body: { key } }
        ),
        fetchFromService<FileUrlResponseData>(
          "media",
          "/internal/v1/files/url",
          callerId,
          { method: "POST", body: { key, fileName } }
        ),
      ])
      return [key, { viewUrl: view.url, downloadUrl: download.url }] as const
    })
  )

  const urls = new Map<string, { viewUrl: string; downloadUrl: string }>()
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Aggregate service: signing a file failed", result.reason)
      continue
    }
    urls.set(...result.value)
  }
  return urls
}
