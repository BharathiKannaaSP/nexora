import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import type { AdminAccessRequestPermission } from "@nexora/shared/types/onboarding"

/**
 * Country access, then moduleCode, then accessLevel, e.g.
 * { IN: { USER_MANAGEMENT: ["VIEW", "EDIT"] } }. Countries are ISO 3166-1
 * alpha-2, uppercase, as stored on AdminAccessRequestPermission.countryCode.
 */
export type CountryPermissions = Record<
  string,
  Partial<Record<PermissionModuleCode, PermissionAction[]>>
>

/** One module and the action within it that something needs. */
export interface RequiredPermission {
  moduleCode: PermissionModuleCode
  accessLevel: PermissionAction
}

const isModuleCode = (value: string): value is PermissionModuleCode =>
  (PERMISSION_MODULES as readonly string[]).includes(value)

const isAccessLevel = (value: string): value is PermissionAction =>
  (PERMISSION_ACTIONS as readonly string[]).includes(value)

/**
 * Groups AdminAccessRequestPermission rows by countryCode, then moduleCode,
 * then accessLevel. Rows outside the catalog are dropped.
 */
export const toCountryPermissions = (
  rows: Pick<
    AdminAccessRequestPermission,
    "countryCode" | "moduleCode" | "accessLevel"
  >[]
): CountryPermissions =>
  rows.reduce<CountryPermissions>(
    (permissions, { countryCode, moduleCode, accessLevel }) => {
      if (!isModuleCode(moduleCode) || !isAccessLevel(accessLevel)) {
        return permissions
      }
      const country = (permissions[countryCode.toUpperCase()] ??= {})
      const actions = (country[moduleCode] ??= [])
      if (!actions.includes(accessLevel)) actions.push(accessLevel)
      return permissions
    },
    {}
  )

/** Whether `permissions` grant `required` in `countryCode` (any case). */
export const hasPermission = (
  permissions: CountryPermissions,
  countryCode: string,
  { moduleCode, accessLevel }: RequiredPermission
) =>
  permissions[countryCode.toUpperCase()]?.[moduleCode]?.includes(accessLevel) ??
  false
