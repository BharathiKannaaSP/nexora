import express from "express"
import cors from "cors"
import helmet from "helmet"
import webhookRoutes from "./routes/webhook.routes"

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
)

/** Clerk Webhook  This must come BEFORE express.json() */
app.use(
  "/api/v1/webhooks",
  express.raw({
    type: "application/json",
  }),
  webhookRoutes
)

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
  })
})

export default app
