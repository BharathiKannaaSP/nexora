import {
  PENDING_VERIFICATION_STORAGE_KEY,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "@nexora/shared/constants/auth"

export interface PendingVerification {
  /** Email or username the user signed in with. */
  identifier: string
  /** Epoch ms after which a new link can be requested. */
  resendAvailableAt: number
}

/**
 * Kept in sessionStorage rather than the URL so the email stays out of
 * history and server logs, and survives a reload or language switch.
 */
export function savePendingVerification(identifier: string) {
  writePendingVerification({
    identifier,
    resendAvailableAt: Date.now() + VERIFICATION_RESEND_COOLDOWN_MS,
  })
}

export function writePendingVerification(value: PendingVerification) {
  try {
    sessionStorage.setItem(
      PENDING_VERIFICATION_STORAGE_KEY,
      JSON.stringify(value)
    )
  } catch {
    // Storage can be blocked (private mode); resend is simply unavailable.
  }
}

export function readPendingVerification(): PendingVerification | null {
  try {
    const raw = sessionStorage.getItem(PENDING_VERIFICATION_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PendingVerification>
    if (
      typeof value.identifier !== "string" ||
      typeof value.resendAvailableAt !== "number"
    ) {
      return null
    }
    return value as PendingVerification
  } catch {
    return null
  }
}

export function clearPendingVerification() {
  try {
    sessionStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY)
  } catch {}
}
