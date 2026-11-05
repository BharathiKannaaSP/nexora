import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/media-env"
import { deleteFile, signFileUrl, signFileUrls } from "./media-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

// Service-to-service only. Callers must check access before calling.
const router: Router = Router()

router.use(verifyGateway)

router.post("/files/url", signFileUrl)
router.post("/files/urls", signFileUrls)
router.post("/files/delete", deleteFile)

export default router