import helmet from "helmet"
import express, { Express } from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/gateway-error-handler"
import { env } from "./config/gateway-env"
import proxyRoutes from "./routes/proxy-routes"

const app: Express = express()

app.disable("x-powered-by")

// Requests arrive from the admin Next.js server, which forwards the browser's
// IP in X-Forwarded-For. Trusting it only from TRUST_PROXY gives req.ip the
// visitor's address, so the limits below apply per visitor, not to everyone
// at once.
app.set("trust proxy", env.TRUST_PROXY)

app.use(helmet())

app.use(
  cors({
    origin(origin, callback) {
      // Disallowed origins get no CORS headers, so the browser blocks the
      // response.
      callback(null, !origin || env.CLIENT_ORIGINS.includes(origin))
    },
    credentials: true,
  })
)

const tooManyRequests = {
  success: false,
  message: "Too many requests, please try again later",
  code: "TOO_MANY_REQUESTS",
}

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: tooManyRequests,
  })
)

// Credential and email endpoints get a tighter budget against password
// guessing and email flooding. auth-service also limits sign-in per account.
app.use(
  [
    "/api/v1/auth/sign-in",
    "/api/v1/auth/register",
    "/api/v1/auth/resend-verification",
    "/api/v1/auth/verify-email",
  ],
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // limit each IP to 20 requests per windowMs
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: tooManyRequests,
  })
)

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "nexora-api-gateway is running",
    uptime: process.uptime(),
  })
})

app.use(proxyRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
