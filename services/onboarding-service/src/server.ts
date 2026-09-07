import "dotenv/config"

import app, { startApp, stopApp } from "./app"

import { env } from "./config/env"

const start = async (): Promise<void> => {
  try {
    console.log("Starting Nexora Onboarding Service...")

    // Start Kafka consumer
    await startApp()

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      console.log(`Onboarding Service running on http://localhost:${env.PORT}`)
    })

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`Received ${signal}. Shutting down...`)

      server.close(async () => {
        try {
          await stopApp()

          console.log("Onboarding Service stopped.")

          process.exit(0)
        } catch (error) {
          console.error("Error while shutting down Onboarding Service:", error)

          process.exit(1)
        }
      })
    }

    process.on("SIGINT", () => {
      void shutdown("SIGINT")
    })

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM")
    })
  } catch (error) {
    console.error("Failed to start Onboarding Service:", error)

    process.exit(1)
  }
}

void start()
