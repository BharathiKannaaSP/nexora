import express from "express"
import helmet from "helmet"
import onboardingRoutes from "./routes/onboarding.routes"
import { notFoundMiddleware } from "./middleware/not-found-middleware"
import { errorMiddleware } from "./middleware/error-middleware"
import {
  startUserCreatedConsumer,
  stopUserCreatedConsumer,
} from "./consumers/user-created.consumer"

const app = express()

app.use(helmet())

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "onboarding-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/v1/onboarding", onboardingRoutes)

app.use(notFoundMiddleware)

app.use(errorMiddleware)

/**
 * Start application dependencies
 */
export const startApp = async (): Promise<void> => {
  await startUserCreatedConsumer()
}

/**
 * Stop application dependencies
 */
export const stopApp = async (): Promise<void> => {
  await stopUserCreatedConsumer()
}

export default app
