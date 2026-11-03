import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { createBecomeAdminSchema } from "@nexora/schemas/onboarding/become-admin"
import { updateOnboardingStepSchema } from "@nexora/schemas/onboarding/update-step"
import { Request, Response, RequestHandler } from "express"
import {
  getBecomeAdminFormDetailsService,
  getGrantedPermissionsService,
  getOnboardingDetailsService,
  submitBecomeAdminRequestService,
  updateOnboardingStepService,
} from "./onboarding-service"

export const onboardingDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

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
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

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
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

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

export const getBecomeAdminFormDetails: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

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

export const getGrantedPermissions: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

    const grantedPermissions = await getGrantedPermissionsService(userId)

    return sendSuccess(
      res,
      200,
      "Granted permissions fetched",
      "ONBOARDING.GRANTED_PERMISSIONS_FETCHED",
      grantedPermissions
    )
  }
)
