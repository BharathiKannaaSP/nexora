import app from "./auth-app"
import { env } from "./config/auth-env"
import { startAdminAccessApprovedConsumer } from "./consumers/admin-access-approved.consumer"
import { startOrganizationMembershipCreatedConsumer } from "./consumers/organization-membership-created.consumer"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Auth service running on", env.PORT)
})

startAdminAccessApprovedConsumer()
  .then(() => console.info("Admin access approved consumer started"))
  .catch((error: unknown) => {
    console.error("Admin access approved consumer failed to start", error)
    process.exitCode = 1
  })

startOrganizationMembershipCreatedConsumer()
  .then(() => console.info("Organization membership created consumer started"))
  .catch((error: unknown) => {
    console.error("Organization membership created consumer failed to start", error)
    process.exitCode = 1
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
