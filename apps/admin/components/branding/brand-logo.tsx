import React from "react"
import Link from "next/link"
import { cn } from "@nexora/ui/lib/utils"

interface BrandLogoProps {
  name?: string
  href?: string
  className?: string
}

export const BrandLogo = ({
  name = "NEXORA",
  href = "/",
  className,
}: BrandLogoProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center",
        "text-xl font-semibold tracking-wider",
        className
      )}
      aria-label={`${name} home`}
    >
      {name}
    </Link>
  )
}
