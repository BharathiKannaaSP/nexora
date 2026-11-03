import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import {
  CircleCheckIcon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

const bannerVariants = cva(
  "relative flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm [&>[data-slot=banner-icon]_svg]:pointer-events-none [&>[data-slot=banner-icon]_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/30 bg-info/10 text-info",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BannerVariant = NonNullable<VariantProps<typeof bannerVariants>["variant"]>

const defaultIcons: Record<BannerVariant, React.ReactNode> = {
  default: <InfoIcon aria-hidden="true" />,
  info: <InfoIcon aria-hidden="true" />,
  success: <CircleCheckIcon aria-hidden="true" />,
  warning: <TriangleAlertIcon aria-hidden="true" />,
  destructive: <OctagonXIcon aria-hidden="true" />,
}

type BannerProps = React.ComponentProps<"div"> &
  VariantProps<typeof bannerVariants> & {
    /** Overrides the variant's icon; pass `null` to hide it. */
    icon?: React.ReactNode
    /** Rendered at the end of the banner, e.g. a button or link. */
    action?: React.ReactNode
  }

function Banner({
  className,
  variant = "default",
  icon,
  action,
  children,
  ...props
}: BannerProps) {
  const resolvedIcon =
    icon === undefined ? defaultIcons[variant ?? "default"] : icon
  const isUrgent = variant === "destructive" || variant === "warning"

  return (
    <div
      data-slot="banner"
      data-variant={variant}
      role={isUrgent ? "alert" : "status"}
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    >
      {resolvedIcon && (
        <span data-slot="banner-icon" className="mt-0.5 shrink-0">
          {resolvedIcon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
      {action && (
        <div data-slot="banner-action" className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

function BannerTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="banner-title"
      className={cn("leading-5 font-medium", className)}
      {...props}
    />
  )
}

function BannerDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="banner-description"
      className={cn("leading-5 text-foreground/80", className)}
      {...props}
    />
  )
}

export { Banner, BannerTitle, BannerDescription, bannerVariants }
export type { BannerProps, BannerVariant }
