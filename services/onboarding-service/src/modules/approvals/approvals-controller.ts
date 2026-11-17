import type { Request, RequestHandler, Response } from "express"

import { approvalQueueQuerySchema } from "@nexora/schemas/onboarding/approvals"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { requireUserId } from "@nexora/shared/express/require-user-id"

import { getApprovalQueueService } from "./approvals-service"

export const getApprovalQueue: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const query = approvalQueueQuerySchema.parse(req.query)
    const data = await getApprovalQueueService(userId, query)

    return sendSuccess(
      res,
      200,
      "Approval queue fetched",
      "ONBOARDING.APPROVAL_QUEUE_FETCHED",
      data
    )
  }
)
