import { Router } from "express"

import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"

import { env } from "../config/aggregate-env"
import { me } from "./aggregate-controller"
import {
  getApproval,
  getApprovals,
  getApprovalsSummary,
} from "./approvals/approvals-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.use(verifyGateway)

router.get("/me", me)


router.get("/approvals", getApprovals)
router.get("/approvals/summary", getApprovalsSummary)
router.get("/approvals/:type/:id", getApproval)

export default router
