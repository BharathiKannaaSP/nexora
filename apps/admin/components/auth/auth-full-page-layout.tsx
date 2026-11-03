import { BrandLogo } from "@/components/branding"
import { LanguageSwitcher } from "@/components/common"
import { cn } from "@nexora/ui/lib/utils"
import { ReactNode } from "react"

interface AuthFullPageLayoutProps {
  children: ReactNode
  homeHref?: string
  className?: string
  cardClassName?: string
}

/** Single centered card with a logo and language bar, no brand panel. */
export const AuthFullPageLayout = ({
  children,
  homeHref,
  className,
  cardClassName,
}: AuthFullPageLayoutProps) => {
  return (
    <main
      className={cn(
        "flex min-h-svh w-full flex-col bg-background text-foreground",
        className
      )}
    >
      <header className="flex items-center justify-between gap-2 px-7 pt-2 sm:px-10 sm:pt-10 lg:justify-between lg:px-12 lg:pt-12 xl:px-14 xl:pt-14">
        <BrandLogo href={homeHref} />
        <LanguageSwitcher className="static" />
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div
          className={cn(
            "w-full max-w-xl rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10",
            cardClassName
          )}
        >
          {children}
        </div>
      </section>
    </main>
  )
}
