import { redirect } from "next/navigation"
import type { ReactNode } from "react"
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

/**
 * Renders `children` only when `path` is where the user belongs right now,
 * and redirects there otherwise: unverified users to verify-email, then each
 * onboarding step in turn, then the dashboard. Must sit inside <Suspense>:
 * the overview is an uncached, per-user fetch.
 */
export const BootstrapGuard = async ({
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
