"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@nexora/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@nexora/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@nexora/ui/components/sidebar"
import { EllipsisVertical, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useTransition } from "react"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { logout } from "@/lib/api/auth/logout"

const UserSummary = ({
  fullName,
  initials,
  userName,
}: {
  fullName: string
  initials: string
  userName: string
}) => (
  <>
    <Avatar className="size-8 rounded-lg after:rounded-lg">
      <AvatarImage alt={fullName} className="rounded-lg" />
      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
    </Avatar>
    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium text-foreground">{fullName}</span>
      <span className="truncate text-xs text-muted-foreground">
        @{userName}
      </span>
    </div>
  </>
)

export const NavUser = () => {
  const { country, lang } = useParams<{ country: string; lang: string }>()
  const { account } = useBootstrap()
  const { isMobile } = useSidebar()
  const t = useTranslations("dashboard")
  const [isPending, startTransition] = useTransition()

  const fullName = `${account.firstName} ${account.lastName}`.trim()
  const initials =
    `${account.firstName.charAt(0)}${account.lastName.charAt(0)}`.toUpperCase()
  const summary = (
    <UserSummary
      fullName={fullName}
      initials={initials}
      userName={account.userName}
    />
  )

  const handleSignOut = () =>
    startTransition(async () => {
      await logout(country, lang)
    })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            {summary}
            <EllipsisVertical aria-hidden="true" className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5">
                  {summary}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={isPending}
              onClick={handleSignOut}
            >
              <LogOut aria-hidden="true" />
              {t("userMenu.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
