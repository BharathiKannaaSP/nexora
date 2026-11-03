import { cn } from "@nexora/ui/lib/utils"
import { ReactNode } from "react"

export interface FeatureItemProps {
  id: string
  title: string
  icon: ReactNode
  description: string
}

interface FeatureListProps {
  features: FeatureItemProps[]
  className?: string
  itemClassName?: string
}

export const FeatureList = ({
  features,
  className,
  itemClassName,
}: FeatureListProps) => {
  return (
    <ul className={cn("flex flex-col gap-5", className)}>
      {features.map((feature) => (
        <li
          key={feature.id}
          className={cn("flex items-center gap-4", itemClassName)}
        >
          {feature.icon && (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/70">
              {feature.icon}
            </span>
          )}

          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">{feature.title}</p>
            <p className="text-sm leading-5 text-stone-600">
              {feature.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
