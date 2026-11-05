import type { Request, RequestHandler, Response } from "express"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import {
  getMyOrganizationsService,
  getOrganizationService,
} from "./organization-service"

const requireUserId = (req: Request) => {
  const userId = req.headers["x-user-id"]

  if (typeof userId !== "string" || !userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
  }

  return userId
}

export const getMyOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const organizations = await getMyOrganizationsService(userId)

    return sendSuccess(
      res,
      200,
      "Organizations fetched",
      "ORGANIZATIONS_FETCHED",
      organizations
    )
  }
)

export const getOrganization: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const organization = await getOrganizationService(
      String(req.params.organizationId),
      userId
    )

    return sendSuccess(
      res,
      200,
      "Organization fetched",
      "ORGANIZATION_FETCHED",
      organization
    )
  }
)
