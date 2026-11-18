import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface DetailRowProps {
  icon: LucideIcon
  label: string
  children: ReactNode
}

/** One label/value line of a <dl>, label (with icon) left, value right. */
export const DetailRow = ({ icon: Icon, label, children }: DetailRowProps) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="flex items-center gap-3 text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </dt>
    <dd className="min-w-0 truncate text-end font-medium">{children}</dd>
  </div>
)
