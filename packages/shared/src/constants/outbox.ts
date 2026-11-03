export const OUTBOX_BATCH_SIZE = 20
export const OUTBOX_MAX_ATTEMPTS = 3
export const OUTBOX_POLL_INTERVAL_MS = 2_000 // 2 seconds in milliseconds
export const OUTBOX_BASE_RETRY_DELAY_MS = 2_000 // 2 seconds in milliseconds
export const OUTBOX_MAX_RETRY_DELAY_MS = 5 * 60_000 // 5 minutes in milliseconds
