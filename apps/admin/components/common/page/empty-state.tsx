import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { IconTile } from "../stats/icon-tile"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
    <IconTile icon={icon} tone="neutral" />
    <div className="space-y-1">
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {action}
  </div>
)
