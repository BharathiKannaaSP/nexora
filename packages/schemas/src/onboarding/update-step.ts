import { z } from "zod"

/**
 * The steps a user moves through themselves, in order. COMPLETED isn't one:
 * only an approval sets it.
 */
export const USER_ONBOARDING_STEPS = [
  "BASIC_INFORMATION",
  "CHOOSE_PATH",
  "ROLE_REQUIREMENTS",
  "REVIEW",
] as const

export const USER_ONBOARDING_SELECTED_PATHS = [
  "BECOME_ADMIN",
  "CREATE_ORGANIZATION",
  "JOIN_ORGANIZATION",
] as const

/**
 * PATCH /onboarding/step. Moves to the next step, or back to an earlier one;
 * onboarding-service rejects skipping ahead. `selectedPath`, when sent, is
 * saved in the same write, e.g. leaving CHOOSE_PATH for ROLE_REQUIREMENTS;
 * left out, the current path is kept.
 */
export const updateOnboardingStepSchema = z.object({
  step: z.enum(USER_ONBOARDING_STEPS),
  selectedPath: z.enum(USER_ONBOARDING_SELECTED_PATHS).optional(),
})

export type UpdateOnboardingStepInput = z.infer<
  typeof updateOnboardingStepSchema
>
