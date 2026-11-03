import { resolveLocaleParams } from "@/lib/i18n/locale-params"
import { SidebarProvider } from "@nexora/ui/components/sidebar"
import { ReactNode } from "react"

interface DashboardRouteLayoutProps {
  children: ReactNode
  params: Promise<{ country: string; lang: string }>
}

const DashboardRouteLayout = async ({
  children,
  params,
}: DashboardRouteLayoutProps) => {
  await resolveLocaleParams(params)
  return <SidebarProvider>{children}</SidebarProvider>
}

export default DashboardRouteLayout
