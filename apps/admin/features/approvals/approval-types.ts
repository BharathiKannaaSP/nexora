import {
  Building2,
  ClipboardCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import {
  APPROVAL_REQUEST_TYPES,
  REVIEWER_ACCESS_LEVEL,
  REVIEWER_MODULE,
  type ApprovalRequestType,
} from "@nexora/schemas/onboarding/approvals"

import type { Tone } from "@/components/common/tones"
import {
  hasPermission,
  type CountryPermissions,
  type RequiredPermission,
} from "@/lib/auth/permissions"

export const APPROVALS_PATH = "/approvals"

export interface ApprovalTypeConfig {
  /** In the URL, ?type=<slug>; also the sidebar child's query. */
  slug: string
  /** Row icon and badge colour. */
  icon: LucideIcon
  tone: Tone
  /** What a reviewer of this type must hold in the country. */
  permission: RequiredPermission
  /** Where a row opens. */
  detailPath: (id: string) => string
}

const reviewer = (type: ApprovalRequestType): RequiredPermission => ({
  moduleCode: REVIEWER_MODULE[type],
  accessLevel: REVIEWER_ACCESS_LEVEL,
})

export const APPROVAL_TYPES = {
  ADMIN_ACCESS: {
    slug: "admin",
    icon: UserCog,
    tone: "success",
    permission: reviewer("ADMIN_ACCESS"),
    detailPath: (id) => `${APPROVALS_PATH}/admin/${id}`,
  },
  CREATE_ORG: {
    slug: "organization",
    icon: Building2,
    tone: "warning",
    permission: reviewer("CREATE_ORG"),
    detailPath: (id) => `${APPROVALS_PATH}/organization/${id}`,
  },
  JOIN_ORG: {
    slug: "member",
    icon: UsersRound,
    tone: "info",
    permission: reviewer("JOIN_ORG"),
    detailPath: (id) => `${APPROVALS_PATH}/member/${id}`,
  },
} as const satisfies Record<ApprovalRequestType, ApprovalTypeConfig>

/** The "Total pending" card's icon. */
export const APPROVALS_TOTAL_ICON = ClipboardCheck

export const approvalTypeFromSlug = (slug: string | undefined) =>
  APPROVAL_REQUEST_TYPES.find((type) => APPROVAL_TYPES[type].slug === slug)

/** The types the user reviews in this country, in registry order. */
export const visibleApprovalTypes = (
  permissions: CountryPermissions,
  countryCode: string
) =>
  APPROVAL_REQUEST_TYPES.filter((type) =>
    hasPermission(permissions, countryCode, APPROVAL_TYPES[type].permission)
  )
