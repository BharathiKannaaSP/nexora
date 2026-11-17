"use client"

import { createContext, use, useMemo, type ReactNode } from "react"

import type { CurrentUserOverviewResponseData } from "@nexora/shared/types/aggregate"

import { toCountryPermissions } from "@/lib/auth/permissions"

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

/**
 * The signed-in user's permissions, from the same overview (see
 * getPermissions() for Server Components). Only below BootstrapGuard.
 */
export const usePermissions = () => {
  const { permissions } = useBootstrap()
  return useMemo(() => toCountryPermissions(permissions), [permissions])
}
