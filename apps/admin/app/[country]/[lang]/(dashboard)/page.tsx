import { BootstrapGuard } from "@/features/bootstrap/bootstrap-guard"
import { DASHBOARD_PATH } from "@/lib/bootstrap/bootstrap-path"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import {
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@nexora/ui/components/sidebar"
import { AppSidebar } from "@/components/common/app-sidebar"
import { getGrantedPermissions } from "@/lib/api/onboarding/granted-permissions"
import { LanguageSwitcher } from "@/components/common"

interface DashboardPageProps {
  params: Promise<LocaleParams>
}

// Fetched below BootstrapGuard, so only once the user belongs here.
const DashboardSidebar = async () => (
  <AppSidebar permissions={await getGrantedPermissions()} />
)

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "dashboard" })

  return (
    <Suspense>
      <BootstrapGuard country={country} lang={lang} path={DASHBOARD_PATH}>
        <DashboardSidebar />
        <SidebarInset>
          {/* On mobile the sidebar is a sheet; this is the only way to open it. */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b bg-background px-4 py-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <LanguageSwitcher className="static" />
            </div>
          </header>
          <main className="p-4 sm:p-6">
            <h1>{t("home.metadata.title")}</h1>
          </main>
        </SidebarInset>
      </BootstrapGuard>
    </Suspense>
  )
}

export default DashboardPage
