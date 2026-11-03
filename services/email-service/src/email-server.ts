import { startVerificationEmailConsumer } from "./consumers/verification-email.consumer"

async function main(): Promise<void> {
  await startVerificationEmailConsumer()
  console.info("Verification email consumer started")
}

main().catch((error: unknown) => {
  console.error("Email Service failed to start", error)
  process.exitCode = 1
})
