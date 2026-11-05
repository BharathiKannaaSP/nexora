import app from "./media-app"
import { env } from "./config/media-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Media service running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Media service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Media service:", error)
    } else {
      console.log("Media service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
