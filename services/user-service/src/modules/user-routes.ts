import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/user-env"
import { getUserDetails, updateUserDetails } from "./user-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.get("/user-details", verifyGateway, getUserDetails)
router.put("/user-details", verifyGateway, updateUserDetails)

export default router
