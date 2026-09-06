import express from "express"
import { requestIdMiddleware } from "./middleware/request-id-middleware"
import {
  configureRateLimiter,
  configureSecurity,
} from "./middleware/security-middleware"
import morgan from "morgan"
import routes from "./routes/index"
import { errorMiddleware } from "./middleware/error-middleware"
import { notFoundMiddleware } from "./middleware/not-found-middleware"

export const createApp = () => {
  const app = express()

  app.disable("x-powered-by")

  app.use(requestIdMiddleware)

  configureSecurity(app)

  configureRateLimiter(app)

  app.use(express.json({ limit: "10mb" }))

  app.use(
    express.urlencoded({
      extended: true,
      limit: "1mb",
    })
  )

  app.use(
    morgan(
      ":method :url :status :response-time ms request-id=:req[x-request-id]"
    )
  )

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      service: "nexora-api-gateway",
      status: "ok",
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
    })
  })

  app.use(routes)

  app.use(notFoundMiddleware)

  app.use(errorMiddleware)

  return app
}
