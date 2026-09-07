import app from "./app"
import { env } from "./config/env"

const server = app.listen(env.PORT, () => {
  console.log(`Auth Service running on http://localhost:${env.PORT}`)
})

const shutdown = () => {
  console.log("Shutting down Auth Service...")

  server.close(() => {
    console.log("Auth Service stopped.")
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
