import type { BecomeAdminFormDetailsResponseData } from "@nexora/shared/types/onboarding"

import { apiResult, type ApiResult } from "../result"

export async function getBecomeAdminFormDetails(): Promise<
  ApiResult<BecomeAdminFormDetailsResponseData>
> {
  return apiResult.get<BecomeAdminFormDetailsResponseData>(
    "/onboarding/become-admin-request-details"
  )
}
