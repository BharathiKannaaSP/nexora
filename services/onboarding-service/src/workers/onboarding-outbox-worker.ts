import "dotenv/config"
import "temporal-polyfill/full/global"
import { startOutboxPublisher } from "../outbox/onboarding-outbox-publisher"

startOutboxPublisher().catch((error: unknown) => {
  console.error("Outbox worker terminated unexpectedly", error)
  process.exitCode = 1
})
