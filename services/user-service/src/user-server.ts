import app from "./user-app"
import { env } from "./config/user-env"
import { startCreateUserProfileConsumer } from "./consumers/create-user-profile.consumer"

const server = app.listen(env.PORT, () => {
  console.log("Nexora User service running on", env.PORT)
})

startCreateUserProfileConsumer()
  .then(() => console.info("Create user profile consumer started"))
  .catch((error: unknown) => {
    console.error("Create user profile consumer failed to start", error)
    process.exitCode = 1
  })

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing User service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing User service:", error)
    } else {
      console.log("User service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
