import { z } from "zod"

/** Ids per call; callers chunk longer lists. */
export const USER_LOOKUP_MAX_IDS = 100

export const userLookupInputSchema = z.object({
  ids: z
    .array(z.string().min(1).max(64))
    .min(1)
    .max(USER_LOOKUP_MAX_IDS)
    .transform((ids) => [...new Set(ids)]),
})
export type UserLookupInput = z.infer<typeof userLookupInputSchema>