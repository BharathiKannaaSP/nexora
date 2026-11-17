"use client"

import { EllipsisVertical, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"

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

import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useSignOut } from "@/hooks/use-sign-out"

const UserSummary = ({
  fullName,
  initials,
  userName,
  imageUrl,
}: {
  fullName: string
  imageUrl: string | null
  initials: string
  userName: string
}) => (
  <>
    <Avatar className="size-8 rounded-lg after:rounded-lg">
      {imageUrl && (
        <AvatarImage src={imageUrl} alt={fullName} className="rounded-lg" />
      )}
      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
    </Avatar>
    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium text-foreground" title={fullName}>
        {fullName}
      </span>
      <span
        className="truncate text-xs text-muted-foreground"
        title={`@${userName}`}
      >
        @{userName}
      </span>
    </div>
  </>
)

export const NavUser = () => {
  const { account } = useBootstrap()
  const { isMobile } = useSidebar()
  const t = useTranslations("dashboard")
  const { signOut, isPending } = useSignOut()

  const fullName = `${account.firstName} ${account.lastName}`.trim()
  const initials =
    `${account.firstName.charAt(0)}${account.lastName.charAt(0)}`.toUpperCase()
  const summary = (
    <UserSummary
      fullName={fullName}
      initials={initials}
      userName={account.userName}
      imageUrl={account.profileImageUrl}
    />
  )

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
              onClick={signOut}
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
