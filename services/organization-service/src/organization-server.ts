import { env } from "./config/organization-env"
import { startOrganizationRequestApprovedConsumer } from "./consumers/organization-request-approved.consumer"
import app from "./organization-app"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Organization service running on", env.PORT)
})

startOrganizationRequestApprovedConsumer()
  .then(() => console.info("Organization request approved consumer started"))
  .catch((error: unknown) => {
    console.error("Organization request approved consumer failed to start", error)
    process.exitCode = 1
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
