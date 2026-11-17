import { Router } from "express"

import { getApprovalQueue } from "./approvals-controller"

// Mounted on the onboarding router, which already runs verifyGateway.
const router: Router = Router()

// Only ever the caller's own queue, so it's safe through the gateway too.
router.get("/approvals/queue", getApprovalQueue)

export default router
