import { Router } from "express"

import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"

import { env } from "../config/user-env"
import {
  getPlatformCountries,
  getUserDetails,
  updateUserDetails,
} from "./user-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.get("/user-details", verifyGateway, getUserDetails)
router.put("/user-details", verifyGateway, updateUserDetails)
// The countries the user may open besides their saved one.
router.get("/platform-countries", verifyGateway, getPlatformCountries)

export default router
