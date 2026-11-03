import type { Request, RequestHandler, Response } from "express"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import { getCurrentUserOverview } from "./aggregate-service"

export const me: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // Set by the gateway after it verifies the access token.
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError(
        "Access token is required",
        401,
        "ACCESS_TOKEN_REQUIRED"
      )
    }

    const overview = await getCurrentUserOverview(userId)

    return sendSuccess(
      res,
      200,
      "Current user overview fetched successfully",
      "AGGREGATE.ME.SUCCESS",
      overview
    )
  }
)
