import app from "./organization-app"
import { env } from "./config/organization-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Organization service running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Organization service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Organization service:", error)
    } else {
      console.log("Organization service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
