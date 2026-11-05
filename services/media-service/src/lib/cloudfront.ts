import { getSignedUrl } from "@aws-sdk/cloudfront-signer"
import { env } from "../config/media-env"

/** Keys are UUIDs plus [a-z0-9/-.], but encode each segment anyway. */
const toCdnUrl = (key: string) =>
  `${env.CLOUDFRONT_URL}/${key.split("/").map(encodeURIComponent).join("/")}`

export const canSignCloudFrontUrls = Boolean(
  env.CLOUDFRONT_KEY_PAIR_ID && env.CLOUDFRONT_PRIVATE_KEY
)

/**
 * Expiry rounded up to the next `ttlSeconds` window, plus one window. A URL
 * lives between ttl and 2 x ttl seconds and stays the same within a window,
 * so the browser can cache the file.
 */
export const windowedExpiry = (ttlSeconds: number) => {
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = (Math.ceil(now / ttlSeconds) + 1) * ttlSeconds
  return { expiresAt, expiresInSeconds: expiresAt - now }
}

/**
 * CloudFront signed URL valid until `expiresAt` (Unix seconds, from
 * windowedExpiry). Extra query parameters (e.g. response-content-disposition)
 * are added before signing, since the canned policy covers the full URL.
 */
export const signCloudFrontUrl = (
  key: string,
  expiresAt: number,
  query?: Record<string, string>
) => {
  if (!env.CLOUDFRONT_KEY_PAIR_ID || !env.CLOUDFRONT_PRIVATE_KEY) {
    throw new Error("CloudFront signing is not configured")
  }

  const search = query ? `?${new URLSearchParams(query)}` : ""

  return getSignedUrl({
    url: `${toCdnUrl(key)}${search}`,
    keyPairId: env.CLOUDFRONT_KEY_PAIR_ID,
    privateKey: env.CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: new Date(expiresAt * 1000),
  })
}
