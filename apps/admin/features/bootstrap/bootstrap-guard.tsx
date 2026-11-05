import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { PermissionGuard } from "@/features/permissions/permission-guard"
import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"
import {
  resolveBootstrapPath,
  type BootstrapPath,
} from "@/lib/bootstrap/bootstrap-path"
import { href } from "@/lib/i18n/config"

import { BootstrapProvider } from "./bootstrap-provider"

interface BootstrapGuardProps {
  country: string
  lang: string
  /** The page these children belong on, from resolveBootstrapPath(). */
  path: BootstrapPath
  children: ReactNode
}

const BootstrapPathGuard = async ({
  country,
  lang,
  path,
  children,
}: BootstrapGuardProps) => {
  const overview = await bootstrap(country, lang)
  const expectedPath = resolveBootstrapPath(overview)

  if (expectedPath !== path) {
    redirect(href(country, lang, expectedPath))
  }

  return <BootstrapProvider overview={overview}>{children}</BootstrapProvider>
}

/**
 * Renders `children` only when `path` is where the user belongs right now,
 * and redirects there otherwise: unverified users to verify-email, then each
 * onboarding step in turn, then the dashboard. PermissionGuard runs first,
 * so a country the user may not use goes straight to their saved country.
 * Must sit inside <Suspense>: the overview is an uncached, per-user fetch
 * (shared by both guards, as bootstrap() is cached per request).
 */
export const BootstrapGuard = ({
  country,
  lang,
  ...props
}: BootstrapGuardProps) => (
  <PermissionGuard country={country} lang={lang}>
    <BootstrapPathGuard country={country} lang={lang} {...props} />
  </PermissionGuard>
)
