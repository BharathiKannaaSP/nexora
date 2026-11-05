import app from "./onboarding-app"
import { env } from "./config/onboarding-env"
import { startInitiateUserOnboardingConsumer } from "./consumers/initiate-user-onboarding.consumer"
import { startUserPlatformPermissionsChangedConsumer } from "./consumers/user-platform-permissions-changed.consumer"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Onboarding service running on", env.PORT)
})

startInitiateUserOnboardingConsumer()
  .then(() => console.info("Initiate user onboarding consumer started"))
  .catch((error: unknown) => {
    console.error("Initiate user onboarding consumer failed to start", error)
    process.exitCode = 1
  })

startUserPlatformPermissionsChangedConsumer()
  .then(() => console.info("User platform permissions consumer started"))
  .catch((error: unknown) => {
    console.error("User platform permissions consumer failed to start", error)
    process.exitCode = 1
  })

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Onboarding service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Onboarding service:", error)
    } else {
      console.log("Onboarding service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
