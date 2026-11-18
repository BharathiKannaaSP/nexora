import type { Request, RequestHandler, Response } from "express"

import {
  approvalDecisionInputSchema,
  approvalQueueQuerySchema,
  approvalRequestParamsSchema,
} from "@nexora/schemas/onboarding/approvals"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { requireUserId } from "@nexora/shared/express/require-user-id"

import {
  decideApprovalService,
  getApprovalRecordService,
} from "./approval-record-service"
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

export const getApprovalRecord: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const params = approvalRequestParamsSchema.parse(req.params)
    const data = await getApprovalRecordService(userId, params)

    return sendSuccess(
      res,
      200,
      "Approval request fetched",
      "ONBOARDING.APPROVAL_FETCHED",
      data
    )
  }
)

export const decideApproval: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const params = approvalRequestParamsSchema.parse(req.params)
    const input = approvalDecisionInputSchema.parse(req.body)
    const data = await decideApprovalService(userId, params, input)

    return sendSuccess(
      res,
      200,
      data.status === "APPROVED" ? "Request approved" : "Request rejected",
      data.status === "APPROVED"
        ? "ONBOARDING.APPROVAL_APPROVED"
        : "ONBOARDING.APPROVAL_REJECTED",
      data
    )
  }
)
