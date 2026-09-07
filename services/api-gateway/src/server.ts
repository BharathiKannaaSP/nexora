import { createApp } from "./app"
import { env } from "./config/env"

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Nexora API Gateway running on http://localhost:${env.PORT}`)
  console.log(`Environment: ${env.PORT}`)
  console.log(`Auth Service: ${env.AUTH_SERVICE_URL}`)
  console.log(`Onboarding Service: ${env.ONBOARDING_SERVICE_URL}`)
})

const shutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down...`)

  server.close(() => {
    console.log("API Gateway stopped.")
    process.exit(0)
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))

process.on("SIGINT", () => shutdown("SIGINT"))
