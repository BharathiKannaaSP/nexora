import app from "./gateway-app"
import { env } from "./config/gateway-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora API gateway running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing API Gateway...")
  server.close((error) => {
    if (error) {
      console.error("Error closing API Gateway:", error)
    } else {
      console.log("API Gateway closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
