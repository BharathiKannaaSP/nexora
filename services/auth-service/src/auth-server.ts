import app from "./auth-app"
import { env } from "./config/auth-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Auth service running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Auth service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Auth service:", error)
    } else {
      console.log("Auth service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
