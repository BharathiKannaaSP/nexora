"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@nexora/ui/components/sidebar"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useMemo } from "react"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import type { CountryPermissions } from "@/lib/auth/permissions"
import { DASHBOARD_PATH } from "@/lib/bootstrap/bootstrap-path"
import { href } from "@/lib/i18n/config"
import { getSidebarNav } from "@/lib/navigation/sidebar-nav"
import { BrandLogo } from "../branding"
import { NavUser } from "./nav-user"

interface AppSidebarProps {
  /** What the user was granted, by country, then module, then action. */
  permissions?: CountryPermissions
}

export const AppSidebar = ({ permissions = {} }: AppSidebarProps) => {
  const { country, lang } = useParams<{ country: string; lang: string }>()
  const pathname = usePathname()
  const { account } = useBootstrap()
  const t = useTranslations("dashboard")
  const { isMobile, setOpenMobile } = useSidebar()

  const groups = useMemo(
    () => getSidebarNav({ countryCode: country, permissions }),
    [country, permissions]
  )

  return (
    <Sidebar>
      <SidebarHeader className="gap-1 px-4 py-4">
        <BrandLogo href={href(country, lang)} />
        <span className="text-xs text-sidebar-foreground/70">
          {t(`roles.${account.systemRole}`)}
        </span>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel className="tracking-wider uppercase">
              {t(`sidebar.groups.${group.key}`)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ key, path, icon: Icon }) => {
                  const itemHref = href(country, lang, path)
                  // The dashboard is the root, so only an exact match counts.
                  const isActive =
                    path === DASHBOARD_PATH
                      ? pathname === itemHref
                      : pathname.startsWith(itemHref)
                  const label = t(`sidebar.items.${key}`)

                  return (
                    <SidebarMenuItem key={key}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={label}
                        render={
                          <Link
                            href={itemHref}
                            onClick={() => isMobile && setOpenMobile(false)}
                          />
                        }
                      >
                        <Icon aria-hidden="true" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
