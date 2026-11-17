import type { Request, RequestHandler, Response } from "express"

import {
  approvalSummaryQuerySchema,
  listApprovalsQuerySchema,
} from "@nexora/schemas/onboarding/approvals"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import {
  ACCESS_TOKEN_REQUIRED,
  requireUserId,
} from "@nexora/shared/express/require-user-id"

import { getApprovalSummary, listApprovals } from "./approvals-service"

export const getApprovals: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req, ACCESS_TOKEN_REQUIRED)

    const query = listApprovalsQuerySchema.parse(req.query)
    const data = await listApprovals(userId, query)

    return sendSuccess(res, 200, "Approvals fetched", "AGGREGATE.APPROVALS.SUCCESS", data)
  }
)

export const getApprovalsSummary: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req, ACCESS_TOKEN_REQUIRED)

    const query = approvalSummaryQuerySchema.parse(req.query)
    const data = await getApprovalSummary(userId, query)

    return sendSuccess(
      res,
      200,
      "Approvals summary fetched",
      "AGGREGATE.APPROVALS_SUMMARY.SUCCESS",
      data
    )
  }
)
