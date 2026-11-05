"use server"

import type { UpdateOnboardingStepInput } from "@nexora/schemas/onboarding/update-step"
import type { UpdateOnboardingStepResponseData } from "@nexora/shared/types/onboarding"

import { apiResult, type ApiResult } from "../result"

/** Moves the signed-in user's onboarding to `step`: the next one, or back. */
export async function updateOnboardingStep(
  values: UpdateOnboardingStepInput
): Promise<ApiResult<UpdateOnboardingStepResponseData>> {
  return apiResult.patch<UpdateOnboardingStepResponseData>(
    "/onboarding/step",
    values
  )
}
