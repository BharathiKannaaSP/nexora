import { COUNTRY_HEADER } from "@nexora/shared/constants/i18n"
import { defaultCountry, isCountry, type CountryCode } from "./config"

// Returns the Vercel-detected country when it is one we support.
export function getDetectedCountry(headers: Headers): CountryCode | null {
  const country = headers.get(COUNTRY_HEADER)?.toLowerCase()

  return country && isCountry(country) ? country : null
}

export function getUserCountry(headers: Headers): CountryCode {
  return getDetectedCountry(headers) ?? defaultCountry
}
