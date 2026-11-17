import Link from "next/link"
import type { ReactNode } from "react"

interface FilterBarProps {
  children: ReactNode
  /** Where "Clear filters" goes; the link is hidden without it. */
  clearHref?: string
  clearLabel: string
}

export const FilterBar = ({
  children,
  clearHref,
  clearLabel,
}: FilterBarProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    {children}
    {clearHref && (
      <Link
        href={clearHref}
        scroll={false}
        className="text-sm font-medium text-primary hover:underline sm:ms-auto"
      >
        {clearLabel}
      </Link>
    )}
  </div>
)
