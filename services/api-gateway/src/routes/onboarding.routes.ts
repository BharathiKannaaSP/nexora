import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import { createProxyMiddleware } from "http-proxy-middleware"
import { createProxyOptions } from "../proxy/create-proxy"
import { services } from "../config/services"

const router = Router()

router.use(requireAuth)

router.use(
  createProxyMiddleware({
    ...createProxyOptions(services.onboarding),

    pathRewrite: {
      "^/api/v1/onboarding": "/api/v1/onboarding",
    },
  })
)

export default router
