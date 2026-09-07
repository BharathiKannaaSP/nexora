import express from "express"
import helmet from "helmet"
import webhookRoutes from "./routes/webhook.routes"
import authRoutes from "./routes/auth.routes"
import { notFoundMiddleware } from "./middleware/not-found-middleware"
import { errorMiddleware } from "./middleware/error-middleware"

const app = express()

app.use(helmet())

/** Clerk Webhook  This must come BEFORE express.json() */
app.use(
  "/api/v1/auth/webhooks",
  express.raw({
    type: "application/json",
  }),
  webhookRoutes
)

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "auth-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/v1/auth", authRoutes)

app.use(notFoundMiddleware)

app.use(errorMiddleware)

export default app
