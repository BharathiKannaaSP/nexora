"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useMemo } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@nexora/ui/components/sidebar"

import {
  useBootstrap,
  usePermissions,
} from "@/features/bootstrap/bootstrap-provider"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { DASHBOARD_PATH } from "@/lib/bootstrap/bootstrap-path"
import { href } from "@/lib/i18n/config"
import {
  getSidebarNav,
  type SidebarBadges,
  type SidebarNavChild,
} from "@/lib/navigation/sidebar-nav"
import { withSearchParams } from "@/lib/url/search-params"

import { BrandLogo } from "../branding"
import { CountBadge } from "./filters/count-badge"
import { NavUser } from "./nav-user"

interface AppSidebarProps {
  /** Counts shown next to items, e.g. pending approvals. */
  badges?: SidebarBadges
}

/** A child is active when its query matches; one without a query, when none of its siblings' does. */
const isChildActive = (
  child: SidebarNavChild,
  siblings: SidebarNavChild[],
  searchParams: URLSearchParams
) =>
  child.query
    ? Object.entries(child.query).every(([k, v]) => searchParams.get(k) === v)
    : !siblings.some(
        (s) =>
          s.query &&
          Object.entries(s.query).every(([k, v]) => searchParams.get(k) === v)
      )

export const AppSidebar = ({ badges = {} }: AppSidebarProps) => {
  const { country, lang } = useLocaleParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { account } = useBootstrap()
  const permissions = usePermissions()
  const t = useTranslations("dashboard")
  const { isMobile, setOpenMobile } = useSidebar()
  const closeOnMobile = () => isMobile && setOpenMobile(false)

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
                {group.items.map(
                  ({ key, path, icon: Icon, badge, children }) => {
                    const itemHref = href(country, lang, path)
                    // The dashboard is the root, so only an exact match counts.
                    const isActive =
                      path === DASHBOARD_PATH
                        ? pathname === itemHref
                        : pathname.startsWith(itemHref)
                    const label = t(`sidebar.items.${key}`)
                    const count = badge ? badges[badge] : undefined

                    return (
                      <SidebarMenuItem key={key}>
                        <SidebarMenuButton
                          isActive={isActive && !children?.length}
                          tooltip={label}
                          render={
                            <Link href={itemHref} onClick={closeOnMobile} />
                          }
                        >
                          <Icon aria-hidden="true" />
                          <span>{label}</span>
                        </SidebarMenuButton>
                        {count !== undefined && !children?.length && (
                          <SidebarMenuBadge>{count}</SidebarMenuBadge>
                        )}
                        {children && children.length > 0 && (
                          <SidebarMenuSub>
                            {children.map((child) => {
                              const childLabel = t(`sidebar.items.${child.key}`)
                              const childCount = child.badge
                                ? badges[child.badge]
                                : undefined
                              const active =
                                isActive &&
                                isChildActive(child, children, searchParams)

                              return (
                                <SidebarMenuSubItem key={child.key}>
                                  <SidebarMenuSubButton
                                    isActive={active}
                                    render={
                                      <Link
                                        href={withSearchParams(
                                          itemHref,
                                          child.query ?? {}
                                        )}
                                        onClick={closeOnMobile}
                                      />
                                    }
                                  >
                                    <span
                                      className="truncate"
                                      title={childLabel}
                                    >
                                      {childLabel}
                                    </span>
                                    {childCount !== undefined && (
                                      <CountBadge
                                        count={childCount}
                                        active={active}
                                        className="ms-auto"
                                      />
                                    )}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    )
                  }
                )}
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
