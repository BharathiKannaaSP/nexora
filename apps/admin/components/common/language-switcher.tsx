"use client"

import { updateMe } from "@/lib/api/auth/update-me"
import { getCountryLanguages, isLocale, type Locale } from "@/lib/i18n/config"
import { Label } from "@nexora/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nexora/ui/components/select"
import { cn } from "@nexora/ui/lib/utils"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { useId } from "react"

export function LanguageSwitcher({ className }: { className?: string }) {
  const id = useId()
  const locale = useLocale()
  const t = useTranslations("common")
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split("/")
  const country = segments[1] ?? "in"

  // Only show languages supported by the current country.
  const languageItems = getCountryLanguages(country).map(
    ({ code, language }) => ({
      value: code,
      label: language,
    })
  )

  async function changeLanguage(nextLocale: Locale) {
    if (nextLocale === locale) return

    if (segments.length < 3) {
      throw new Error(`Cannot change language for unexpected path: ${pathname}`)
    }

    const nextSegments = [...segments]
    nextSegments[2] = nextLocale

    // Saved on the account, so the next sign-in and later emails use it too.
    // Auth pages are signed out. Saved together with the country, since the
    // pair must be valid as a whole. A failure only costs that; the switch
    // itself still happens.
    if (segments[3] !== "auth") {
      try {
        await updateMe({ countryCode: country, preferredLocale: nextLocale })
      } catch (error) {
        console.error(error)
      }
    }

    // Keep the query (e.g. the verify-email token). Read at click time rather
    // than with useSearchParams, which would need a Suspense boundary.
    router.push(nextSegments.join("/") + window.location.search)
  }

  return (
    <div
      className={cn(
        "inset-e-7 sm:inset-e-10 lg:inset-e-12 xl:inset-e-14 absolute top-6 z-20 flex items-center",
        className
      )}
    >
      <Label htmlFor={id} className="sr-only">
        {t("languageLabel")}
      </Label>

      <Select
        id={id}
        items={languageItems}
        value={locale}
        onValueChange={(value) => {
          if (
            value &&
            languageItems.some((item) => item.value === value) &&
            isLocale(value)
          ) {
            void changeLanguage(value)
          }
        }}
      >
        <SelectTrigger size="sm" className="w-44">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {languageItems.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
