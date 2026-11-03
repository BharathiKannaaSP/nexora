/**
 * Counts failures per key in a fixed window. The gateway's limits are per IP;
 * this caps guesses against one account however many IPs they come from.
 *
 * Counts live in this process's memory, so each auth-service instance keeps
 * its own. Move them to a shared store (e.g. Redis) when running several.
 */
export const createAttemptLimiter = (options: {
  limit: number
  windowMs: number
}) => {
  const attempts = new Map<string, { count: number; resetAt: number }>()

  const current = (key: string) => {
    const entry = attempts.get(key)
    if (entry && entry.resetAt <= Date.now()) {
      attempts.delete(key)
      return undefined
    }
    return entry
  }

  // Drop finished windows so guesses at unknown accounts can't grow the map
  // without bound.
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(key)
    }
  }, options.windowMs).unref()

  return {
    isBlocked: (key: string) => (current(key)?.count ?? 0) >= options.limit,

    recordFailure: (key: string) => {
      const entry = current(key)
      if (entry) {
        entry.count += 1
        return
      }
      attempts.set(key, { count: 1, resetAt: Date.now() + options.windowMs })
    },

    reset: (key: string) => {
      attempts.delete(key)
    },
  }
}
