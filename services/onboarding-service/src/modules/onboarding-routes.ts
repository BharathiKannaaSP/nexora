import { Router } from "express"

import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"

import { env } from "../config/onboarding-env"
import {
  getAdminPermissions,
  getBecomeAdminFormDetails,
  getCreateOrganizationFormDetails,
  getJoinOrganizationFormDetails,
  onboardingDetails,
  removeOrganizationRequestFile,
  submitBecomeAdminRequest,
  submitOrganizationRequest,
  updateOnboardingStep,
} from "./onboarding-controller"

import approvalsRoutes from "./approvals/approvals-routes"


const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.use(verifyGateway)

router.use(approvalsRoutes)




router.get("/onboardingDetails", onboardingDetails)
router.patch("/step", updateOnboardingStep)
router.post("/become-admin-request", submitBecomeAdminRequest)
router.get("/become-admin-request-details", getBecomeAdminFormDetails)
router.post("/organization-request", submitOrganizationRequest)
router.get(
  "/create-organization-form-details",
  getCreateOrganizationFormDetails
)
router.get("/join-organization-form-details", getJoinOrganizationFormDetails)
router.post("/organization-request/remove-file", removeOrganizationRequestFile)
router.get("/admin-permissions", getAdminPermissions)

export default router
