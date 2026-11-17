import { UserRound } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@nexora/ui/components/avatar"
import { cn } from "@nexora/ui/lib/utils"

interface UserAvatarProps {
  name?: string | null
  src?: string | null
  className?: string
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toLocaleUpperCase())
    .join("")

export const UserAvatar = ({ name, src, className }: UserAvatarProps) => (
  <Avatar className={cn("size-9", className)}>
    {src && <AvatarImage src={src} alt="" />}
    <AvatarFallback className="text-xs font-medium">
      {name ? (
        initials(name)
      ) : (
        <UserRound className="size-4" aria-hidden="true" />
      )}
    </AvatarFallback>
  </Avatar>
)
