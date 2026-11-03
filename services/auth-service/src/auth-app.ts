import express, { Express } from "express"
import helmet from "helmet"
import cors from "cors"
import { env } from "./config/auth-env"
import cookieParser from "cookie-parser"
import authRoutes from "./modules/auth-routes"
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
    service: "nexora-auth-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/auth", authRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("Auth service"))

export default app
