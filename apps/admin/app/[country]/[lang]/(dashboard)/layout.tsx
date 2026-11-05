import { ReactNode } from "react"

import { SidebarProvider } from "@nexora/ui/components/sidebar"

import { resolveLocaleParams } from "@/lib/i18n/locale-params"

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
