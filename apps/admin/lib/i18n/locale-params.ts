import { notFound } from "next/navigation"
import { isCountry, isLocale } from "./config"

export interface LocaleParams {
  country: string
  lang: string
}

/**
 * Narrows route params to a supported country and locale. proxy.ts already
 * rewrites unsupported ones to /not-found; this gives pages typed values and
 * backs that up. The layout's own check doesn't cover pages, since layouts
 * and pages render in parallel.
 */
export async function resolveLocaleParams(params: Promise<LocaleParams>) {
  const { country, lang } = await params
  if (!isCountry(country) || !isLocale(lang)) notFound()
  return { country, lang }
}
