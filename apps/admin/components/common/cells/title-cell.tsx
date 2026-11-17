import type { LucideIcon } from "lucide-react"

import { IconTile } from "../stats/icon-tile"
import type { Tone } from "../tones"

interface TitleCellProps {
  icon: LucideIcon
  tone: Tone
  title: string
  subtitle?: string
}

export const TitleCell = ({ icon, tone, title, subtitle }: TitleCellProps) => (
  <div className="flex min-w-64 items-center gap-3">
    <IconTile icon={icon} tone={tone} size="sm" />
    <div className="min-w-0">
      <p className="truncate text-sm font-medium" title={title}>
        {title}
      </p>
      {subtitle && (
        <p className="truncate text-xs text-muted-foreground" title={subtitle}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
)
