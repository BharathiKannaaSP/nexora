import { env } from "./env"

export const services = {
  auth: env.AUTH_SERVICE_URL,
  onboarding: env.ONBOARDING_SERVICE_URL,
} as const
