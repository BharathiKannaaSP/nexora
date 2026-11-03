import { cn } from "@nexora/ui/lib/utils"
import { HTMLAttributes, ReactNode } from "react"

interface AuthFormPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  action?: ReactNode
  footer?: ReactNode
  contentClassName?: string
}

export const AuthFormPanel = ({
  children,
  action,
  footer,
  contentClassName,
  className,
  ...props
}: AuthFormPanelProps) => {
  return (
    <div
      className={cn("flex min-h-full w-full flex-col", className)}
      {...props}
    >
      {action && (
        <div className="flex justify-end pt-8 sm:pt-10 lg:pt-12">{action}</div>
      )}

      <div
        className={cn(
          "flex flex-1 flex-col justify-center py-6",
          contentClassName
        )}
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>

      {footer && (
        <div className="px-6 pb-6 sm:px-10 sm:pb-8 lg:px-12">{footer}</div>
      )}
    </div>
  )
}
