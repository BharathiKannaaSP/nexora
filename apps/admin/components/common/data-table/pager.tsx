import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import Link from "next/link"
import type { ReactNode } from "react"

import { buttonVariants } from "@nexora/ui/components/button"
import { cn } from "@nexora/ui/lib/utils"

import { getPageItems } from "@/lib/pagination"

interface PagerProps {
  page: number
  pageCount: number
  getPageHref: (page: number) => string
}

const pageButton = (active = false) =>
  cn(
    buttonVariants({ variant: active ? "secondary" : "ghost", size: "icon" }),
    active && "bg-primary/10 font-medium text-primary hover:bg-primary/15"
  )

/** Prev, numbered pages with ellipses, next. All links. */
export const Pager = ({ page, pageCount, getPageHref }: PagerProps) => {
  const t = useTranslations("common")
  const format = useFormatter()

  const edge = (
    target: number,
    disabled: boolean,
    label: string,
    icon: ReactNode
  ) =>
    disabled ? (
      <span
        aria-disabled="true"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "opacity-50"
        )}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </span>
    ) : (
      <Link
        href={getPageHref(target)}
        scroll={false}
        className={buttonVariants({ variant: "outline", size: "icon" })}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Link>
    )

  return (
    <nav aria-label={t("table.pagination")} className="flex items-center gap-1">
      {edge(
        page - 1,
        page <= 1,
        t("table.previousPage"),
        <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
      )}
      <ul className="flex items-center gap-1">
        {getPageItems(page, pageCount).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Link
                href={getPageHref(item)}
                scroll={false}
                aria-current={item === page ? "page" : undefined}
                aria-label={t("table.goToPage", { page: item })}
                className={pageButton(item === page)}
              >
                {format.number(item)}
              </Link>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="flex size-8 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </li>
          )
        )}
      </ul>
      {edge(
        page + 1,
        page >= pageCount,
        t("table.nextPage"),
        <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
      )}
    </nav>
  )
}
