import Link from "next/link"

import { cn } from "@nexora/ui/lib/utils"

import { CountBadge } from "./count-badge"

export interface FilterTabItem<T extends string> {
  value: T
  label: string
  href: string
  count?: number
}

interface FilterTabsProps<T extends string> {
  label: string
  items: FilterTabItem<T>[]
  value: T
}

export function FilterTabs<T extends string>({
  label,
  items,
  value,
}: FilterTabsProps<T>) {
  return (
    <nav
      aria-label={label}
      className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5"
    >
      <ul className="flex min-w-max gap-1 border-b">
        {items.map((item) => {
          const active = item.value === value
          return (
            <li key={item.value}>
              <Link
                href={item.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
                {item.count !== undefined && (
                  <CountBadge count={item.count} active={active} />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
