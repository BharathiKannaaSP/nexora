import "dotenv/config"
import "temporal-polyfill/full/global"
import { startOutboxPublisher } from "../outbox/user-outbox-publisher"

startOutboxPublisher().catch((error: unknown) => {
  console.error("Outbox worker terminated unexpectedly", error)
  process.exitCode = 1
})
