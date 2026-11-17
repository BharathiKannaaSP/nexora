import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@nexora/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@nexora/ui/components/tooltip"

export interface RowAction {
  icon: LucideIcon
  label: string
  href: string
}

/** Outline icon links; the label is the accessible name and the tooltip. */
export const RowActions = ({ actions }: { actions: RowAction[] }) => (
  <div className="flex items-center justify-end gap-2">
    {actions.map(({ icon: Icon, label, href }) => (
      <Tooltip key={label}>
        <TooltipTrigger
          render={
            <Link
              href={href}
              aria-label={label}
              className={buttonVariants({
                variant: "outline",
                size: "icon-lg",
              })}
            />
          }
        >
          <Icon className="rtl:rotate-180" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    ))}
  </div>
)
