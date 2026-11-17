import { Suspense, type ReactNode } from "react"

import { SidebarInset, SidebarTrigger } from "@nexora/ui/components/sidebar"

import { AppSidebar } from "@/components/common/app-sidebar"
import { CountrySwitcher } from "@/components/common/country-switcher"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { BootstrapGuard } from "@/features/bootstrap/bootstrap-guard"
import { getPendingApprovalSummary } from "@/lib/api/approvals/get-approval-summary"
import { getPermissions } from "@/lib/auth/get-permissions"
import { DASHBOARD_PATH } from "@/lib/bootstrap/bootstrap-path"
import {
  canSeeApprovals,
  type SidebarBadges,
} from "@/lib/navigation/sidebar-nav"

const approvalBadges = async (country: string): Promise<SidebarBadges> => {
  const result = await getPendingApprovalSummary(country)
  // Counts are extra: without them the links still work.
  if (!result.success) return {}

  const { total, byType } = result.data.summary
  return {
    "approvals.total": total,
    "approvals.ADMIN_ACCESS": byType.ADMIN_ACCESS,
    "approvals.CREATE_ORG": byType.CREATE_ORG,
    "approvals.JOIN_ORG": byType.JOIN_ORG,
  }
}

// Fetched below BootstrapGuard, so only once the user belongs here.
const DashboardSidebar = async ({
  country,
  lang,
}: {
  country: string
  lang: string
}) => {
  const permissions = await getPermissions(country, lang)
  const badges = canSeeApprovals(permissions, country)
    ? await approvalBadges(country)
    : {}

  return <AppSidebar badges={badges} />
}

interface DashboardShellProps {
  country: string
  lang: string
  children: ReactNode
}

export const DashboardShell = ({
  country,
  lang,
  children,
}: DashboardShellProps) => (
  <Suspense>
    <BootstrapGuard country={country} lang={lang} path={DASHBOARD_PATH}>
      <DashboardSidebar country={country} lang={lang} />
      <SidebarInset className="min-w-0">
        {/* On mobile the sidebar is a sheet; this is the only way to open it. */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-background px-4 py-3">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <CountrySwitcher />
            <LanguageSwitcher className="static" />
          </div>
        </header>
        <main className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </BootstrapGuard>
  </Suspense>
)
