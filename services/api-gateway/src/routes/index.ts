import { Router } from "express"

import authRoutes from "./auth.routes.js"
import onboardingRoutes from "./onboarding.routes.js"

const router = Router()

router.use("/api/v1/auth", authRoutes)
router.use("/api/v1/onboarding", onboardingRoutes)

export default router
