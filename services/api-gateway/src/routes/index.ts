import { Router } from "express"

import authRoutes from "./auth.routes"
import onboardingRoutes from "./onboarding.routes"

const router = Router()

router.use("/api/v1/auth", authRoutes)
router.use("/api/v1/onboarding", onboardingRoutes)

export default router
