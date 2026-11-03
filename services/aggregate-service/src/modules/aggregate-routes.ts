import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/aggregate-env"
import { me } from "./aggregate-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.use(verifyGateway)

router.get("/me", me)

export default router
