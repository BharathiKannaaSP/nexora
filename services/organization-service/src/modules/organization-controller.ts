import type { Request, RequestHandler, Response } from "express"

import { organizationDirectoryQuerySchema } from "@nexora/schemas/organization/directory"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { requireUserId } from "@nexora/shared/express/require-user-id"

import {
  getMyOrganizationsService,
  getOrganizationDirectoryEntryService,
  getOrganizationDirectoryService,
  getOrganizationService,
} from "./organization-service"

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

export const getOrganizationDirectory: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // Any signed-in user may search the directory.
    requireUserId(req)

    const query = organizationDirectoryQuerySchema.parse(req.query)
    const directory = await getOrganizationDirectoryService(query)

    return sendSuccess(
      res,
      200,
      "Organizations fetched",
      "ORGANIZATIONS_FETCHED",
      directory
    )
  }
)

export const getOrganizationDirectoryEntry: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    requireUserId(req)

    const entry = await getOrganizationDirectoryEntryService(
      String(req.params.organizationId)
    )

    return sendSuccess(
      res,
      200,
      "Organization fetched",
      "ORGANIZATION_FETCHED",
      entry
    )
  }
)
