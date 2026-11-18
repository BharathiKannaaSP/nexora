import { Router } from "express"

import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"

import { env } from "../config/user-env"
import { getUserDetailsById } from "./user-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

// Mounted under /internal/v1, which the gateway never proxies: only other
// services (e.g. aggregate-service, for an approval's applicant) call it.
const router: Router = Router()

router.use(verifyGateway)

router.get("/users/:userId/details", getUserDetailsById)

export default router
