import type { JoinOrganizationFormDetailsResponseData } from "@nexora/shared/types/onboarding"

import { apiResult, type ApiResult } from "../result"

export async function getJoinOrganizationFormDetails(): Promise<
  ApiResult<JoinOrganizationFormDetailsResponseData>
> {
  return apiResult.get<JoinOrganizationFormDetailsResponseData>(
    "/onboarding/join-organization-form-details"
  )
}
