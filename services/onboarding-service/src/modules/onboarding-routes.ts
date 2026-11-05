import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/onboarding-env"
import { Router } from "express"
import {
  onboardingDetails,
  submitBecomeAdminRequest,
  updateOnboardingStep,
  getBecomeAdminFormDetails,
  getAdminPermissions,
  submitOrganizationRequest,
  getCreateOrganizationFormDetails,
  removeOrganizationRequestFile,
} from "./onboarding-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.use(verifyGateway)

router.get("/onboardingDetails", onboardingDetails)
router.patch("/step", updateOnboardingStep)
router.post("/become-admin-request", submitBecomeAdminRequest)
router.get("/become-admin-request-details", getBecomeAdminFormDetails)
router.post("/organization-request", submitOrganizationRequest)
router.get(
  "/create-organization-form-details",
  getCreateOrganizationFormDetails
)
router.post("/organization-request/remove-file", removeOrganizationRequestFile)
router.get("/admin-permissions", getAdminPermissions)

export default router
