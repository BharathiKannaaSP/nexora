import app from "./aggregate-app"
import { env } from "./config/aggregate-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Aggregate service running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Aggregate service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Aggregate service:", error)
    } else {
      console.log("Aggregate service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
