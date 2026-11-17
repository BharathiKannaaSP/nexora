"use client"

import { useFormatter } from "next-intl"

import { cn } from "@nexora/ui/lib/utils"

interface CountBadgeProps {
  count: number
  active?: boolean
  className?: string
}

export const CountBadge = ({
  count,
  active = false,
  className,
}: CountBadgeProps) => {
  const format = useFormatter()

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums",
        active
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {format.number(count)}
    </span>
  )
}
