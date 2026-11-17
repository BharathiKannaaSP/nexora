import { Router } from "express"

import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"

import { env } from "../config/user-env"
import {
  getUserDetails,
  getUserPermissions,
  updateUserDetails,
} from "./user-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.get("/user-details", verifyGateway, getUserDetails)
router.put("/user-details", verifyGateway, updateUserDetails)
// The user's platform permissions: the one place the app reads them from.
router.get("/permissions", verifyGateway, getUserPermissions)

export default router
