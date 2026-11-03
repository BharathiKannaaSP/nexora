import { LanguageSwitcher } from "@/components/common"
import { cn } from "@nexora/ui/lib/utils"
import { ReactNode } from "react"

export interface AuthLayoutProps {
  brandPanel: ReactNode
  children: ReactNode
  className?: string
  brandPanelClassName?: string
  formPanelClassName?: string
}

export const AuthLayout = ({
  brandPanel,
  children,
  className,
  brandPanelClassName,
  formPanelClassName,
}: AuthLayoutProps) => {
  return (
    <main
      className={cn(
        "min-h-svh w-full bg-background text-foreground lg:grid lg:grid-cols-2",
        className
      )}
    >
      {/* Left branding */}
      <aside
        className={cn(
          "hidden lg:block",
          "relative min-h-80 min-w-0 overflow-hidden lg:sticky lg:top-0 lg:h-svh",
          brandPanelClassName
        )}
      >
        {brandPanel}
      </aside>
      {/* Right form panel */}
      <section
        className={cn(
          "flex min-w-0 flex-col",
          "min-h-120 px-6 py-6 sm:px-10 sm:py-10",
          "lg:min-h-svh lg:px-12 lg:py-12 xl:px-14 xl:py-14",
          formPanelClassName
        )}
      >
        <LanguageSwitcher />
        {children}
      </section>
    </main>
  )
}
