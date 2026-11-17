import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  FileClock,
  FolderTree,
  Globe,
  Languages,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  UserCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import {
  REVIEWER_ACCESS_LEVEL,
  REVIEWER_MODULE,
} from "@nexora/schemas/onboarding/approvals"

import {
  satisfiesRule,
  type CountryPermissions,
  type PermissionRule,
  type RequiredPermission,
} from "@/lib/auth/permissions"
import { DASHBOARD_PATH } from "@/lib/bootstrap/bootstrap-path"
import type dashboard from "@/locales/en/dashboard.json"

// Labels live in dashboard.json under sidebar.groups.* and sidebar.items.*.

/** A key under sidebar.items, so every item and child has a label. */
export type SidebarItemKey = keyof typeof dashboard.sidebar.items

/** Count keys a sidebar item can show; filled by the dashboard shell. */
export type SidebarBadgeKey =
  | "approvals.total"
  | "approvals.ADMIN_ACCESS"
  | "approvals.CREATE_ORG"
  | "approvals.JOIN_ORG"

export type SidebarBadges = Partial<Record<SidebarBadgeKey, number>>

export interface SidebarNavChild {
  key: SidebarItemKey
  /** Query added to the parent's path, e.g. { type: "admin" }. */
  query?: Record<string, string>
  permission?: PermissionRule
  badge?: SidebarBadgeKey
}

export interface SidebarNavItem {
  key: SidebarItemKey
  path: string
  icon: LucideIcon
  /**
   * What the item needs in the current country. The system role never stands
   * in for it: an ADMIN sees the item only with this permission too. Left
   * out, everyone sees it.
   */
  permission?: PermissionRule
  badge?: SidebarBadgeKey
  children?: SidebarNavChild[]
}

export interface SidebarNavGroup {
  key: string
  items: SidebarNavItem[]
}

const view = (
  moduleCode: RequiredPermission["moduleCode"]
): RequiredPermission => ({ moduleCode, accessLevel: "VIEW" })

const reviewer = (type: keyof typeof REVIEWER_MODULE): RequiredPermission => ({
  moduleCode: REVIEWER_MODULE[type],
  accessLevel: REVIEWER_ACCESS_LEVEL,
})

/** Anyone who reviews at least one kind of request. */
export const APPROVALS_PERMISSION: PermissionRule = {
  anyOf: [
    reviewer("ADMIN_ACCESS"),
    reviewer("CREATE_ORG"),
    reviewer("JOIN_ORG"),
  ],
}

export const SIDEBAR_NAV = [
  {
    key: "overview",
    items: [{ key: "dashboard", path: DASHBOARD_PATH, icon: LayoutDashboard }],
  },
  {
    key: "platform",
    items: [
      {
        key: "countries",
        path: "/countries",
        icon: Globe,
        permission: view("COUNTRY_MANAGEMENT"),
      },
      {
        key: "languages",
        path: "/languages",
        icon: Languages,
        permission: view("COUNTRY_MANAGEMENT"),
      },
      {
        key: "organizations",
        path: "/organizations",
        icon: Building2,
        permission: view("ORGANIZATION_MANAGEMENT"),
      },
      {
        key: "users",
        path: "/users",
        icon: UsersRound,
        permission: view("USER_MANAGEMENT"),
      },
      {
        key: "admins",
        path: "/admins",
        icon: UserCog,
        permission: view("USER_MANAGEMENT"),
      },
    ],
  },
  {
    key: "access",
    items: [
      {
        key: "approvals",
        path: "/approvals",
        icon: UserCheck,
        permission: APPROVALS_PERMISSION,
        badge: "approvals.total",
        children: [
          { key: "allApprovals", badge: "approvals.total" },
          {
            key: "adminRequests",
            query: { type: "admin" },
            permission: reviewer("ADMIN_ACCESS"),
            badge: "approvals.ADMIN_ACCESS",
          },
          {
            key: "organizationRequests",
            query: { type: "organization" },
            permission: reviewer("CREATE_ORG"),
            badge: "approvals.CREATE_ORG",
          },
          {
            key: "memberRequests",
            query: { type: "member" },
            permission: reviewer("JOIN_ORG"),
            badge: "approvals.JOIN_ORG",
          },
        ],
      },
      {
        key: "rolesPermissions",
        path: "/roles-permissions",
        icon: ShieldCheck,
        permission: view("USER_MANAGEMENT"),
      },
    ],
  },
  {
    key: "commerce",
    items: [
      {
        key: "products",
        path: "/products",
        icon: Package,
        permission: view("PRODUCT_MANAGEMENT"),
      },
      {
        key: "categories",
        path: "/categories",
        icon: FolderTree,
        permission: view("PRODUCT_MANAGEMENT"),
      },
      {
        key: "inventory",
        path: "/inventory",
        icon: Boxes,
        permission: view("INVENTORY_MANAGEMENT"),
      },
      {
        key: "orders",
        path: "/orders",
        icon: ShoppingCart,
        permission: view("BILLING_MANAGEMENT"),
      },
      {
        key: "promotions",
        path: "/promotions",
        icon: Tag,
        permission: view("BILLING_MANAGEMENT"),
      },
    ],
  },
  {
    key: "insights",
    items: [
      {
        key: "reports",
        path: "/reports",
        icon: BarChart3,
        permission: view("ANALYTICS_MANAGEMENT"),
      },
      {
        key: "auditLogs",
        path: "/audit-logs",
        icon: FileClock,
        permission: view("ANALYTICS_MANAGEMENT"),
      },
      { key: "notifications", path: "/notifications", icon: Bell },
      {
        key: "settings",
        path: "/settings",
        icon: Settings,
        permission: view("COUNTRY_MANAGEMENT"),
      },
    ],
  },
] as const satisfies SidebarNavGroup[]

interface SidebarAccess {
  /** The country in the URL, e.g. "au"; permissions only count there. */
  countryCode: string
  permissions: CountryPermissions
}

/** The groups, items and children the user may see; empty groups are dropped. */
export const getSidebarNav = ({ countryCode, permissions }: SidebarAccess) => {
  const allowed = ({ permission }: { permission?: PermissionRule }) =>
    !permission || satisfiesRule(permissions, countryCode, permission)

  return SIDEBAR_NAV.map((group) => ({
    ...group,
    items: (group.items as readonly SidebarNavItem[])
      .filter(allowed)
      .map((item) => ({ ...item, children: item.children?.filter(allowed) })),
  })).filter((group) => group.items.length > 0)
}

/** Whether the user can open the approvals page in this country. */
export const canSeeApprovals = (
  permissions: CountryPermissions,
  countryCode: string
) => satisfiesRule(permissions, countryCode, APPROVALS_PERMISSION)
