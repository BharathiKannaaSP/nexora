import type { Express } from "express"
import cors from "cors"
import helmet from "helmet"
import { env } from "../config/env"
import rateLimit from "express-rate-limit"

export const configureSecurity = (app: Express): void => {
  app.use(helmet())
  app.use(
    cors({
      origin: [env.ADMIN_URL, env.CLIENT_URL],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", " X-Request-ID"],
    })
  )
}

export const configureRateLimiter = (app: Express): void => {
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
      },
    },
  })

  app.use(limiter)
}
