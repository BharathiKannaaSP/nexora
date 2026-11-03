import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/auth-env"
import {
  register,
  verifyEmail,
  resendVerification,
  signIn,
  refresh,
  logout,
  me,
  updateMe,
} from "./auth-controller"
import { listCountries } from "./country-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.post("/register", verifyGateway, register)
router.post("/verify-email", verifyGateway, verifyEmail)
router.post("/resend-verification", verifyGateway, resendVerification)
router.post("/sign-in", verifyGateway, signIn)
router.post("/refresh", verifyGateway, refresh)
router.post("/logout", verifyGateway, logout)
router.get("/me", verifyGateway, me)
router.patch("/me/update", verifyGateway, updateMe)
// Public: sign-up and profile forms need it before or without a session.
router.get("/countries", verifyGateway, listCountries)

export default router
