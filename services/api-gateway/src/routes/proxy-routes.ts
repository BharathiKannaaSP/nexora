import { Router } from "express"
import { authenticate } from "../middleware/authenticate"
import { createServiceProxy } from "./create-service-proxy"
import { env } from "../config/gateway-env"

const router: Router = Router()

// Only authenticate is mounted on a path. Mounting strips the prefix from
// req.url, and the proxies need the full URL both to match their pathFilter
// and to forward the original path upstream.
router.use("/api/v1/auth/me", authenticate)
router.use("/api/v1/aggregate", authenticate)
router.use("/api/v1/onboarding", authenticate)
router.use("/api/v1/user", authenticate)
router.use("/api/v1/organization", authenticate)
router.use("/api/v1/media", authenticate)

router.use(createServiceProxy("/api/v1/aggregate", env.AGGREGATE_SERVICE_URL))
router.use(createServiceProxy("/api/v1/onboarding", env.ONBOARDING_SERVICE_URL))
router.use(createServiceProxy("/api/v1/auth", env.AUTH_SERVICE_URL))
router.use(createServiceProxy("/api/v1/user", env.USER_SERVICE_URL))
router.use(
  createServiceProxy("/api/v1/organization", env.ORGANIZATION_SERVICE_URL)
)
router.use(createServiceProxy("/api/v1/media", env.MEDIA_SERVICE_URL))

export default router
