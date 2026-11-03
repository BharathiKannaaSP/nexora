import { cn } from "@nexora/ui/lib/utils"
import Image from "next/image"
import React from "react"

interface BrandBackgroundProps {
  image?: string
  className?: string
}

export const BrandBackground = ({ image, className }: BrandBackgroundProps) => {
  return (
    <>
      {image && (
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          fill
          preload
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn(
            "object-cover object-center rtl:-scale-x-100",
            className
          )}
        />
      )}

      <div className="absolute inset-0 bg-linear-to-r" aria-hidden="true" />
    </>
  )
}
