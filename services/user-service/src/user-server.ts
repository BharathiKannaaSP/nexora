import { env } from "./config/user-env"
import { startAdminAccessApprovedConsumer } from "./consumers/admin-access-approved.consumer"
import { startOrganizationMembershipCreatedConsumer } from "./consumers/organization-membership-created.consumer"
import { startCreateUserProfileConsumer } from "./consumers/create-user-profile.consumer"
import app from "./user-app"

const server = app.listen(env.PORT, () => {
  console.log("Nexora User service running on", env.PORT)
})

startCreateUserProfileConsumer()
  .then(() => console.info("Create user profile consumer started"))
  .catch((error: unknown) => {
    console.error("Create user profile consumer failed to start", error)
    process.exitCode = 1
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
