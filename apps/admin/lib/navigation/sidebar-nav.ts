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
  type LucideIcon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  UserCheck,
  UserCog,
  UsersRound,
} from "lucide-react"
import {
  hasPermission,
  type CountryPermissions,
  type RequiredPermission,
} from "@/lib/auth/permissions"
import { DASHBOARD_PATH } from "@/lib/bootstrap/bootstrap-path"

// Labels live in dashboard.json under sidebar.groups.* and sidebar.items.*.
export interface SidebarNavItem {
  key: string
  path: string
  icon: LucideIcon
  /**
   * What the item needs in the current country. The system role never stands
   * in for it: an ADMIN sees the item only with this permission too. Left
   * out, everyone sees it.
   */
  permission?: RequiredPermission
}

export interface SidebarNavGroup {
  key: string
  items: SidebarNavItem[]
}

const view = (
  moduleCode: RequiredPermission["moduleCode"]
): RequiredPermission => ({ moduleCode, accessLevel: "VIEW" })

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
        permission: view("USER_MANAGEMENT"),
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

/** The groups and items the user may see; groups left empty are dropped. */
export const getSidebarNav = ({ countryCode, permissions }: SidebarAccess) =>
  SIDEBAR_NAV.map((group) => ({
    ...group,
    items: group.items.filter(
      ({ permission }: SidebarNavItem) =>
        !permission || hasPermission(permissions, countryCode, permission)
    ),
  })).filter((group) => group.items.length > 0)
