import { Request, RequestHandler, Response } from "express"

import { objectKeyInputSchema } from "@nexora/schemas/media/upload"
import { createBecomeAdminSchema } from "@nexora/schemas/onboarding/become-admin"
import { createCreateOrganizationRequestSchema } from "@nexora/schemas/onboarding/create-organization"
import { createJoinOrganizationRequestSchema } from "@nexora/schemas/onboarding/join-organization"
import { updateOnboardingStepSchema } from "@nexora/schemas/onboarding/update-step"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { requireUserId } from "@nexora/shared/express/require-user-id"

import {
  getAdminPermissionsService,
  getBecomeAdminFormDetailsService,
  getCreateOrganizationFormDetailsService,
  getJoinOrganizationFormDetailsService,
  getOnboardingDetailsService,
  removeOrganizationRequestFileService,
  submitBecomeAdminRequestService,
  submitOrganizationRequestService,
  updateOnboardingStepService,
} from "./onboarding-service"

export const onboardingDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const onboardingDetails = await getOnboardingDetailsService(userId)

    return sendSuccess(
      res,
      200,
      "Onboarding details fetched",
      "ONBOARDING_DETAILS_FETCHED",
      onboardingDetails
    )
  }
)

export const updateOnboardingStep: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const input = updateOnboardingStepSchema.parse(req.body)
    const data = await updateOnboardingStepService(userId, input)

    return sendSuccess(
      res,
      200,
      "Onboarding step updated",
      "ONBOARDING.STEP_UPDATED.SUCCESS",
      data
    )
  }
)

export const submitBecomeAdminRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    // Validation messages are the client's; the service only needs the rules.
    const becomeAdminSchema = createBecomeAdminSchema(
      {} as Parameters<typeof createBecomeAdminSchema>[0]
    )
    const input = becomeAdminSchema.parse(req.body)
    const data = await submitBecomeAdminRequestService(userId, input)

    return sendSuccess(
      res,
      200,
      "Admin access request saved",
      "ONBOARDING.BECOME_ADMIN_REQUEST.SUCCESS",
      data
    )
  }
)

export const submitOrganizationRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)
    // `type` picks the schema; each schema checks it again as a literal.
    // Unchecked client input until a schema parses it; anything else is a 400.
    const type: "CREATE" | "JOIN" | undefined = req.body?.type

    const organizationRequestSchema =
      type === "CREATE"
        ? createCreateOrganizationRequestSchema(
            {} as Parameters<typeof createCreateOrganizationRequestSchema>[0]
          )
        : type === "JOIN"
          ? createJoinOrganizationRequestSchema(
              {} as Parameters<typeof createJoinOrganizationRequestSchema>[0]
            )
          : null

    if (!organizationRequestSchema) {
      throw new AppError(
        "Invalid organization request type",
        400,
        "BAD_REQUEST"
      )
    }

    const input = organizationRequestSchema.parse(req.body)
    const data = await submitOrganizationRequestService(userId, input)

    return sendSuccess(
      res,
      200,
      "Organization request saved",
      type === "CREATE"
        ? "ONBOARDING.CREATE_ORGANIZATION_REQUEST.SUCCESS"
        : "ONBOARDING.JOIN_ORGANIZATION_REQUEST.SUCCESS",
      data
    )
  }
)

export const getBecomeAdminFormDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const adminRequestDetails = await getBecomeAdminFormDetailsService(userId)

    return sendSuccess(
      res,
      200,
      "Become admin form details fetched",
      "ONBOARDING.BECOME_ADMIN_FORM_DETAILS_FETCHED",
      adminRequestDetails
    )
  }
)

export const getCreateOrganizationFormDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const createOrganizationFormDetails =
      await getCreateOrganizationFormDetailsService(userId)

    return sendSuccess(
      res,
      200,
      "Create organization form details fetched",
      "ONBOARDING.CREATE_ORGANIZATION_FORM_DETAILS_FETCHED",
      createOrganizationFormDetails
    )
  }
)

export const getJoinOrganizationFormDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const joinOrganizationFormDetails =
      await getJoinOrganizationFormDetailsService(userId)

    return sendSuccess(
      res,
      200,
      "Join organization form details fetched",
      "ONBOARDING.JOIN_ORGANIZATION_FORM_DETAILS_FETCHED",
      joinOrganizationFormDetails
    )
  }
)

export const removeOrganizationRequestFile: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const { key } = objectKeyInputSchema.parse(req.body)
    const data = await removeOrganizationRequestFileService(userId, key)

    return sendSuccess(
      res,
      200,
      "File removed from the organization request",
      "ONBOARDING.ORGANIZATION_FILE_REMOVED",
      data
    )
  }
)

export const getAdminPermissions: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req)

    const grantedPermissions = await getAdminPermissionsService(userId)

    return sendSuccess(
      res,
      200,
      "Granted permissions fetched",
      "ONBOARDING.GRANTED_PERMISSIONS_FETCHED",
      grantedPermissions
    )
  }
)
