import {
  DEFAULT_COUNTRY,
  DEFAULT_LOCALE,
  RTL_LOCALES,
  SUPPORTED_COUNTRIES,
} from "@nexora/shared/constants/i18n"

// Shared so auth-service checks sign-up locales against the same list.
export const supportedCountries = SUPPORTED_COUNTRIES

export type CountryCode = (typeof supportedCountries)[number]["code"]

export type Locale =
  (typeof supportedCountries)[number]["languages"][number]["code"]

export const defaultLocale: Locale = DEFAULT_LOCALE
export const defaultCountry: CountryCode = DEFAULT_COUNTRY

export function isLocale(value: string): value is Locale {
  return supportedCountries.some(({ languages }) =>
    languages.some(({ code }) => code === value)
  )
}

export function isCountry(value: string): value is CountryCode {
  return supportedCountries.some(({ code }) => code === value)
}

export function getDirection(locale: Locale) {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr"
}

export function getCountryLanguages(country: string) {
  return (
    supportedCountries.find(({ code }) => code === country)?.languages ?? []
  )
}

export function getCountryDefaultLanguage(country: string): Locale {
  return (
    supportedCountries.find(({ code }) => code === country)?.defaultLanguage ??
    defaultLocale
  )
}

// A language is only valid for the countries that list it, e.g. "ta" is
// supported in India but not in Japan.
export function isCountryLanguage(country: string, lang: string) {
  return getCountryLanguages(country).some(({ code }) => code === lang)
}

export function localizedPath(country: string, lang: Locale, path = "/") {
  const normalizedPath = path === "/" ? "" : `/${path.replace(/^\/+/, "")}`

  return `/${encodeURIComponent(country)}/${lang}${normalizedPath}`
}

export const href = (country: string, language: string, path?: string) =>
  localizedPath(country, language as Locale, path)
