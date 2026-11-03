"use client"

import type { CurrentUserOverviewResponseData } from "@nexora/shared/types/aggregate"
import { createContext, use, type ReactNode } from "react"

const BootstrapContext = createContext<CurrentUserOverviewResponseData | null>(
  null
)

/** Hands the overview BootstrapGuard fetched to Client Components below it. */
export const BootstrapProvider = ({
  overview,
  children,
}: {
  overview: CurrentUserOverviewResponseData
  children: ReactNode
}) => <BootstrapContext value={overview}>{children}</BootstrapContext>

/** The signed-in user's account and onboarding. Only below BootstrapGuard. */
export const useBootstrap = () => {
  const overview = use(BootstrapContext)
  if (!overview) {
    throw new Error("useBootstrap must be used below <BootstrapGuard>")
  }
  return overview
}
