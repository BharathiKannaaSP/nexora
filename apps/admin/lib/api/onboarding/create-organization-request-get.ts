import type { CreateOrganizationFormDetailsResponseData } from "@nexora/shared/types/onboarding"

import { apiResult, type ApiResult } from "../result"

export async function getCreateOrganizationFormDetails(): Promise<
  ApiResult<CreateOrganizationFormDetailsResponseData>
> {
  return apiResult.get<CreateOrganizationFormDetailsResponseData>(
    "/onboarding/create-organization-form-details"
  )
}
