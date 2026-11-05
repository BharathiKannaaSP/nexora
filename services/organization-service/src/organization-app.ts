import express, { Express } from "express"
import helmet from "helmet"
import cors from "cors"
import { env } from "./config/organization-env"
import cookieParser from "cookie-parser"
import organizationRoutes from "./modules/organization-routes"
import {
  createErrorHandler,
  notFoundHandler,
} from "@nexora/shared/express/error-handler"

const app: Express = express()

app.disable("x-powered-by")

app.use(helmet())

app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  })
)

app.use(express.json({ limit: "10kb" }))

app.use(express.urlencoded({ extended: false }))

app.use(cookieParser())

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "nexora-organization-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/organization", organizationRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("Organization service"))

export default app
