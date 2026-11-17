import type { LucideIcon } from "lucide-react"

import { cn } from "@nexora/ui/lib/utils"

import { toneClasses, type Tone } from "../tones"

const sizes = {
  sm: "size-9 rounded-lg [&>svg]:size-4",
  md: "size-12 rounded-xl [&>svg]:size-6",
} as const

interface IconTileProps {
  icon: LucideIcon
  tone?: Tone
  size?: keyof typeof sizes
  className?: string
}

/** A tinted square with an icon; decorative, so hidden from screen readers. */
export const IconTile = ({
  icon: Icon,
  tone = "neutral",
  size = "md",
  className,
}: IconTileProps) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex shrink-0 items-center justify-center",
      sizes[size],
      toneClasses[tone].tile,
      className
    )}
  >
    <Icon />
  </span>
)
