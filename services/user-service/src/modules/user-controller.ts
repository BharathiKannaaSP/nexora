import type { Request, RequestHandler, Response } from "express"

import { updateUserDetailsSchema } from "@nexora/schemas/user-details/user-details-update"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { requireUserId } from "@nexora/shared/express/require-user-id"
import type { UserPermissionsResponseData } from "@nexora/shared/types/user"

import { getPlatformPermissionsRepository } from "./user-permission-repository"
import { getUserDetailsService, updateUserDetailsService } from "./user-service"

export const getUserPermissions: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const data: UserPermissionsResponseData = {
      permissions: await getPlatformPermissionsRepository(userId),
    }

    return sendSuccess(
      res,
      200,
      "User permissions fetched",
      "USER_PERMISSIONS_FETCHED",
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
