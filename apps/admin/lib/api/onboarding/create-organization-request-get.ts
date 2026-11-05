import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"
import { CreateOrganizationFormDetailsResponseData } from "@nexora/shared/types/onboarding"

export async function getCreateOrganizationFormDetails(): Promise<
  ApiResult<CreateOrganizationFormDetailsResponseData>
> {
  return toApiResult(
    api.get<ApiSuccessResponse<CreateOrganizationFormDetailsResponseData>>(
      "/onboarding/create-organization-form-details",
      {
        cache: "no-store",
      }
    )
  )
}
