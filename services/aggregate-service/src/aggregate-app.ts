import express, { Express } from "express"
import helmet from "helmet"
import aggregateRoutes from "./modules/aggregate-routes"
import {
  createErrorHandler,
  notFoundHandler,
} from "@nexora/shared/express/error-handler"

const app: Express = express()

app.disable("x-powered-by")

app.use(helmet())

app.use(express.json({ limit: "10kb" }))

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "nexora-aggregate-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/aggregate", aggregateRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("Aggregate service"))

export default app
