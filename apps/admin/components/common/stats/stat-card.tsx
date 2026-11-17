"use client"

import type { LucideIcon } from "lucide-react"
import { useFormatter } from "next-intl"
import Link from "next/link"

import { cn } from "@nexora/ui/lib/utils"

import type { Tone } from "../tones"
import { IconTile } from "./icon-tile"

interface StatCardProps {
  icon: LucideIcon
  tone: Tone
  label: string
  value: number
  caption?: string
  /** Makes the whole card a link, e.g. to the filtered list. */
  href?: string
}

const cardClass = "flex items-center gap-4 rounded-xl border bg-card p-4"

export const StatCard = ({
  icon,
  tone,
  label,
  value,
  caption,
  href,
}: StatCardProps) => {
  const format = useFormatter()

  const body = (
    <>
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground" title={label}>
          {label}
        </p>
        <p className="text-2xl tabular-nums">{format.number(value)}</p>
        {caption && (
          <p className="truncate text-xs text-muted-foreground" title={caption}>
            {caption}
          </p>
        )}
      </div>
    </>
  )

  return href ? (
    <Link
      href={href}
      className={cn(
        cardClass,
        "transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
    >
      {body}
    </Link>
  ) : (
    <div className={cardClass}>{body}</div>
  )
}
