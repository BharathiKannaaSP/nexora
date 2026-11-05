import cors from "cors"
import express, { Express } from "express"
import helmet from "helmet"

import {
  createErrorHandler,
  notFoundHandler,
} from "@nexora/shared/express/error-handler"

import { env } from "./config/media-env"
import internalRoutes from "./modules/media-internal-routes"
import mediaRoutes from "./modules/media-routes"

const app: Express = express()

app.disable("x-powered-by")

app.use(helmet())

app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  })
)

// Only upload metadata comes through here; file bytes go straight to S3.
app.use(express.json({ limit: "10kb" }))

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "nexora-media-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/media", mediaRoutes)
app.use("/internal/v1", internalRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("Media service"))

export default app
