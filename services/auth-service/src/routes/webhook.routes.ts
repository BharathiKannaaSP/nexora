import { Router } from "express"

import { handleClerkWebhook } from "../webhooks/clerk.webhook"

const router = Router()

router.post("/clerk", handleClerkWebhook)

export default router
