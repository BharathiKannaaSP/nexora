import { HTMLAttributes, ReactNode } from "react"

import { cn } from "@nexora/ui/lib/utils"

interface AuthFormHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: string
  description?: string
  leading?: ReactNode
  alignment?: "left" | "center"
  titleClassName?: string
  descriptionClassName?: string
}

export const AuthFormHeader = ({
  title,
  description,
  leading,
  alignment = "left",
  className,
  titleClassName,
  descriptionClassName,
  ...props
}: AuthFormHeaderProps) => {
  const isCentered = alignment === "center"

  return (
    <header
      className={cn(
        "flex w-full flex-col gap-3",
        isCentered && "items-center text-center",
        className
      )}
      {...props}
    >
      {leading && <div>{leading}</div>}

      <div className="space-y-2">
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl",
            titleClassName
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "text-sm leading-6 text-muted-foreground sm:text-base",
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
      </div>
    </header>
  )
}
