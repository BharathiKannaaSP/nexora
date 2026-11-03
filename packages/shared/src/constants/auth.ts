// Defaults shared by auth-service and the apps that sit in front of it. Keep
// them here so both sides of a cookie or countdown can't drift apart.

// Reported to clients as `expiresIn` on sign-in and refresh.
export const ACCESS_TOKEN_TTL_SECONDS = 900 // 15 minutes

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Parallel requests from one browser can all send the same refresh token, and
// only the first rotates it. A token revoked this recently lost that race; an
// older one coming back means it was copied.
export const REFRESH_REUSE_GRACE_MS = 10_000 // 10 seconds in milliseconds

// auth-service sets it and admin forwards the value as-is, so the name must match.
export const REFRESH_COOKIE_NAME = "nexora_refresh"

// Name of the access token cookie on the admin origin.
export const ACCESS_COOKIE_NAME = "nexora_access"

// Refresh slightly early so the token is still valid when the request it's
// attached to reaches the gateway.
export const REFRESH_BEFORE_EXPIRY_SECONDS = 10

// A page load sends several requests at once (document, RSC, prefetches), all
// carrying the same refresh token. They share one rotation, and its result is
// kept long enough for requests the browser sent before it got the new
// cookie. REFRESH_REUSE_GRACE_MS covers what this per-process cache can't.
export const REFRESH_SHARED_RESULT_MS = 10_000 // 10 seconds in milliseconds

// Responses that mean the session itself is no good: missing or invalid
// token, deactivated account, deleted user.
export const SIGNED_OUT_STATUSES: ReadonlySet<number> = new Set([401, 403, 404])

export const PASSWORD_HASH_ROUNDS = 12

// Failed sign-ins per account (or per identifier when none matches) before
// sign-in is refused for the rest of the window.
export const SIGN_IN_ATTEMPT_LIMIT = 10
export const SIGN_IN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes in milliseconds

export const VERIFICATION_TOKEN_TTL_HOURS = 72 // 3 days

// auth-service enforces it; the verify-email page counts it down.
export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000 // 1 minute in milliseconds

// sessionStorage key for the sign-in identifier awaiting email verification.
export const PENDING_VERIFICATION_STORAGE_KEY = "nexora.pendingVerification"
