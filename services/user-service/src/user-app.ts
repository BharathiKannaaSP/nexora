import express, { Express } from "express"
import helmet from "helmet"
import cors from "cors"
import { env } from "./config/user-env"
import cookieParser from "cookie-parser"
import userRoutes from "./modules/user-routes"
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
    service: "nexora-user-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/user", userRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("User service"))

export default app
