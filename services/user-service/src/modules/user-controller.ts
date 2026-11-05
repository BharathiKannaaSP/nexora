import type { Request, RequestHandler, Response } from "express"

import { updateUserDetailsSchema } from "@nexora/schemas/user-details/user-details-update"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { requireUserId } from "@nexora/shared/express/require-user-id"
import type { PlatformCountriesResponseData } from "@nexora/shared/types/user"

import { getPlatformCountriesRepository } from "./user-permission-repository"
import { getUserDetailsService, updateUserDetailsService } from "./user-service"

export const getPlatformCountries: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const data: PlatformCountriesResponseData = {
      countries: await getPlatformCountriesRepository(userId),
    }

    return sendSuccess(
      res,
      200,
      "Platform countries fetched",
      "PLATFORM_COUNTRIES_FETCHED",
      data
    )
  }
)

export const getUserDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const userDetails = await getUserDetailsService(userId)

    return sendSuccess(
      res,
      200,
      "User details fetched",
      "USER_DETAILS_FETCHED",
      userDetails
    )
  }
)

export const updateUserDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const input = updateUserDetailsSchema().parse(req.body)

    const data = await updateUserDetailsService(userId, input)

    return sendSuccess(
      res,
      200,
      "User details updated",
      "USER_DETAILS_UPDATED",
      data
    )
  }
)
