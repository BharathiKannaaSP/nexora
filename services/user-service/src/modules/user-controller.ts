import type { Request, RequestHandler, Response } from "express"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import { getUserDetailsService, updateUserDetailsService } from "./user-service"
import { updateUserDetailsSchema } from "@nexora/schemas/user-details/user-details-update"

export const getUserDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

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
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

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
