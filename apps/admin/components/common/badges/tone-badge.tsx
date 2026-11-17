import type { ReactNode } from "react"

import { cn } from "@nexora/ui/lib/utils"

import { toneClasses, type Tone } from "../tones"

interface ToneBadgeProps {
  tone: Tone
  children: ReactNode
  className?: string
}

export const ToneBadge = ({ tone, children, className }: ToneBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
      toneClasses[tone].badge,
      className
    )}
  >
    {children}
  </span>
)
