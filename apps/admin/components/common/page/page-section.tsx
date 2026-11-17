import type { ReactNode } from "react"

import { cn } from "@nexora/ui/lib/utils"

interface PageSectionProps {
  children: ReactNode
  className?: string
  "aria-label"?: string
}

/** The bordered card holding a list: tabs, filters, table, pagination. */
export const PageSection = ({
  children,
  className,
  ...props
}: PageSectionProps) => (
  <section
    className={cn(
      "flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5",
      className
    )}
    {...props}
  >
    {children}
  </section>
)
