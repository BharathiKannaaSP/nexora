import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/organization-env"
import { getMyOrganizations, getOrganization } from "./organization-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.get("/my-organizations", verifyGateway, getMyOrganizations)
router.get("/:organizationId", verifyGateway, getOrganization)

export default router
