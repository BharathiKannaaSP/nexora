import "server-only"

import type { Locale } from "./config"
import type auth from "@/locales/en/auth.json"
import type codes from "@/locales/en/codes.json"
import type common from "@/locales/en/common.json"
import type dashboard from "@/locales/en/dashboard.json"
import type onboarding from "@/locales/en/onboarding.json"

// One entry per locales/<locale>/<namespace>.json file; English is the reference.
export interface Messages {
  auth: typeof auth
  codes: typeof codes
  common: typeof common
  dashboard: typeof dashboard
  onboarding: typeof onboarding
}

type Namespace = keyof Messages

const namespaces = Object.keys({
  auth: true,
  codes: true,
  common: true,
  dashboard: true,
  onboarding: true,
} satisfies Record<Namespace, true>) as Namespace[]

export async function loadMessages(locale: Locale): Promise<Messages> {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const messages = await import(`../../locales/${locale}/${namespace}.json`)
      return [namespace, messages.default] as const
    })
  )

  return Object.fromEntries(entries) as unknown as Messages
}
