"use server"

import type { UpdateOnboardingStepInput } from "@nexora/schemas/onboarding/update-step"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { UpdateOnboardingStepResponseData } from "@nexora/shared/types/onboarding"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** Moves the signed-in user's onboarding to `step`: the next one, or back. */
export async function updateOnboardingStep(
  values: UpdateOnboardingStepInput
): Promise<ApiResult<UpdateOnboardingStepResponseData>> {
  return toApiResult(
    api.patch<ApiSuccessResponse<UpdateOnboardingStepResponseData>>(
      "/onboarding/step",
      values,
      { cache: "no-store" }
    )
  )
}
