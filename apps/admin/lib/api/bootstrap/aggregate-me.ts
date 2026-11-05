import type { CurrentUserOverviewResponseData } from "@nexora/shared/types/aggregate"

import { apiResult, type ApiResult } from "../result"

export const aggregateMe = async (): Promise<
  ApiResult<CurrentUserOverviewResponseData>
> => apiResult.get<CurrentUserOverviewResponseData>("/aggregate/me")
