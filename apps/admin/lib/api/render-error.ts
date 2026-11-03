import { API_ERROR_DIGEST_PREFIX } from "@nexora/shared/constants/api"

/**
 * An error for Server Components to throw when the gateway fails. Next hides
 * `message` in production but keeps a preset `digest`, so the backend code
 * still reaches error.tsx, which shows it as a toast.
 */
export class ApiRenderError extends Error {
  public readonly digest: string

  constructor(
    public readonly code: string,
    status?: number
  ) {
    super(`API request failed (${status ?? "no status"} ${code})`)
    this.name = "ApiRenderError"
    this.digest = `${API_ERROR_DIGEST_PREFIX}${code}`
  }
}

/** The backend code carried by an ApiRenderError, read in error.tsx. */
export const getApiErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== "object" || !("digest" in error)) return
  const { digest } = error as { digest: unknown }
  if (typeof digest !== "string" || !digest.startsWith(API_ERROR_DIGEST_PREFIX))
    return
  return digest.slice(API_ERROR_DIGEST_PREFIX.length)
}
