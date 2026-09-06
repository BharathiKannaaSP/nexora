import { Router } from "express"
import { requireGateway } from "../middleware/requireGateway"
import { getMe } from "../controllers/auth.controller"

const router = Router()

router.get("/me", requireGateway, getMe)

export default router
