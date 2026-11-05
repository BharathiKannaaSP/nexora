import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/media-env"
import {
  completeUpload,
  createUpload,
  deleteOwnUpload,
  getOwnUploadUrl,
} from "./media-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.use(verifyGateway)

router.post("/uploads", createUpload)
router.post("/uploads/complete", completeUpload)
router.get("/uploads/url", getOwnUploadUrl)
router.post("/uploads/delete", deleteOwnUpload)

export default router
