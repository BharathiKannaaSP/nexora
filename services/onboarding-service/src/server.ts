import "dotenv/config"

import {
  startUserCreatedConsumer,
  stopUserCreatedConsumer,
} from "./consumers/user-created.consumer"

const start = async (): Promise<void> => {
  try {
    console.log("Starting Nexora Onboarding Service...")
    await startUserCreatedConsumer()
    console.log("Nexora Onboarding Service started")
  } catch (error) {
    console.error("Failed to start Onboarding Service:", error)
    process.exit(1)
  }
}

const shutdown = async (signal: string): Promise<void> => {
  console.log(`Received ${signal}. Shutting down...`)

  try {
    await stopUserCreatedConsumer()

    process.exit(0)
  } catch (error) {
    console.error("Error during shutdown:", error)

    process.exit(1)
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT")
})

process.on("SIGTERM", () => {
  void shutdown("SIGTERM")
})

void start()
