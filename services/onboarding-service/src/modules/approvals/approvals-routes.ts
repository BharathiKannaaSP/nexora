import { Router } from "express"

import {
  decideApproval,
  getApprovalQueue,
  getApprovalRecord,
} from "./approvals-controller"

// Mounted on the onboarding router, which already runs verifyGateway.
const router: Router = Router()

// Only ever the caller's own queue, so it's safe through the gateway too.
router.get("/approvals/queue", getApprovalQueue)
// Each only for the request's own reviewer; see approval-record-service.ts.
router.get("/approvals/:type/:id", getApprovalRecord)
router.post("/approvals/:type/:id/decision", decideApproval)

export default router
