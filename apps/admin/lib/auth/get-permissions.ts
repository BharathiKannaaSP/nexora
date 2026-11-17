import "server-only"

import { cache } from "react"

import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"

import { toCountryPermissions, type CountryPermissions } from "./permissions"

/**
 * The signed-in user's permissions, from user-service via the bootstrap
 * overview that DashboardShell loads. bootstrap() is cached per request, so
 * this never makes a call of its own: every page and component below the
 * shell reuses the one load. Client Components use usePermissions().
 */
export const getPermissions = cache(
  async (country: string, lang: string): Promise<CountryPermissions> =>
    toCountryPermissions((await bootstrap(country, lang)).permissions)
)
