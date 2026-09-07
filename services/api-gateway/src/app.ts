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
import { createProxyMiddleware } from "http-proxy-middleware"
import { services } from "./config/services"

export const createApp = () => {
  const app = express()

  app.disable("x-powered-by")

  app.set("trust proxy", 1)

  app.use(requestIdMiddleware)

  configureSecurity(app)

  configureRateLimiter(app)

  // Clerk user creation to db goes through api-gateway it should be explicit because of app.use uses raw
  // express.raw({
  //    type: "application/json",
  // })

  app.use(
    "/api/v1/auth/webhooks",
    createProxyMiddleware({
      target: services.auth,
      changeOrigin: true,
      pathRewrite: (path) => {
        return `/api/v1/auth/webhooks${path}`
      },
    })
  )

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
