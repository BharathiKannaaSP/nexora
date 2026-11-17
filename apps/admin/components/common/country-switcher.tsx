"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { useId, useMemo } from "react"

import { Label } from "@nexora/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nexora/ui/components/select"
import { cn } from "@nexora/ui/lib/utils"

import { usePermissions } from "@/features/bootstrap/bootstrap-provider"
import {
  isCountry,
  resolveCountryLanguage,
  supportedCountries,
} from "@/lib/i18n/config"

/**
 * Moves the dashboard to another country the user holds permissions in.
 * Only below BootstrapGuard (it reads usePermissions()). Lists countries
 * Nexora runs in, since only those have a /[country] route.
 */
export function CountrySwitcher({ className }: { className?: string }) {
  const id = useId()
  const locale = useLocale()
  const t = useTranslations("common")
  const pathname = usePathname()
  const router = useRouter()
  const permissions = usePermissions()

  const segments = pathname.split("/")
  const country = segments[1] ?? ""

  const labels = useMemo(() => {
    // Names in the page's language, e.g. "Inde" on /fr/fr.
    const names = new Intl.DisplayNames([locale], { type: "region" })
    const codes = Object.keys(permissions)
      .map((code) => code.toLowerCase())
      .filter(isCountry)
    // The current one stays listed so the input always has a label.
    if (isCountry(country) && !codes.includes(country)) codes.push(country)

    return new Map(
      supportedCountries
        .filter(({ code }) => codes.includes(code))
        .map(({ code, name }) => [
          code as string,
          names.of(code.toUpperCase()) ?? name,
        ])
    )
  }, [permissions, locale, country])

  const items = useMemo(
    () =>
      [...labels.keys()].sort((a, b) =>
        labels.get(a)!.localeCompare(labels.get(b)!, locale)
      ),
    [labels, locale]
  )

  function changeCountry(next: string) {
    if (next === country || !isCountry(next) || segments.length < 3) return

    const nextSegments = [...segments]
    nextSegments[1] = next
    // Keep the language where the new country offers it.
    nextSegments[2] = resolveCountryLanguage(next, locale)

    // Same page, without the query: filters and page numbers belong to the
    // country being left. Not saved on the account: the saved country is the
    // user's own, not one they're managing for now.
    router.push(nextSegments.join("/"))
  }

  if (items.length < 2) return null

  return (
    <div className={cn("flex items-center", className)}>
      <Label htmlFor={id} className="sr-only">
        {t("countryLabel")}
      </Label>

      <Select
        id={id}
        items={items.map((value) => ({ value, label: labels.get(value)! }))}
        value={country}
        onValueChange={(value) => {
          if (value) changeCountry(value)
        }}
      >
        <SelectTrigger size="sm" className="w-32 sm:w-44">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {items.map((value) => (
            <SelectItem key={value} value={value}>
              {labels.get(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
