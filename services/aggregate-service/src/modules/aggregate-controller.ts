import type { Request, RequestHandler, Response } from "express"

import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import {
  ACCESS_TOKEN_REQUIRED,
  requireUserId,
} from "@nexora/shared/express/require-user-id"

import { getCurrentUserOverview } from "./aggregate-service"

export const me: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req, ACCESS_TOKEN_REQUIRED)

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
