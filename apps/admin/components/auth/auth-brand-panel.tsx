import { ReactNode } from "react"
import { cn } from "@nexora/ui/lib/utils"
import {
  FeatureItemProps,
  FeatureList,
  BrandBackground,
  BrandLogo,
} from "@/components/branding"

interface AuthBrandPanelProps {
  portalLabel: string
  title: string
  description: string
  backgroundImage?: string
  features: FeatureItemProps[]
  footerTagLine: string
  homeHref?: string
  children?: ReactNode
  className?: string
}

export const AuthBrandPanel = ({
  portalLabel,
  title,
  description,
  backgroundImage,
  features,
  footerTagLine,
  homeHref,
  children,
  className,
}: AuthBrandPanelProps) => {
  return (
    <aside
      className={cn(
        "relative flex min-h-80 flex-col overflow-hidden",
        "bg-stone-200 p-7 text-stone-950 sm:p-10 lg:min-h-svh lg:p-12 xl:p-14",
        className
      )}
    >
      <BrandBackground image={backgroundImage} />

      <div className="relative z-10 flex flex-1 flex-col">
        <BrandLogo href={homeHref} />

        <div className="mt-12 max-w-lg space-y-5 lg:mt-16">
          <p className="text-xs font-medium tracking-wider uppercase">
            {portalLabel}
          </p>

          <div className="h-px w-12 bg-stone-500" />

          <h1 className="max-w-md text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="max-w-md text-base leading-7">{description}</p>

          {features.length > 0 && (
            <FeatureList features={features} className="pt-4" />
          )}

          {children}
        </div>

        {footerTagLine && (
          <p className="mt-6 text-sm font-medium tracking-wide uppercase">
            {footerTagLine}
          </p>
        )}
      </div>
    </aside>
  )
}
