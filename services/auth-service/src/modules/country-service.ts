import {
  countries,
  getEmojiFlag,
  languages,
  type TCountryCode,
} from "countries-list"
import { getCountry } from "countries-and-timezones"
import territoryInfo from "cldr-core/supplemental/territoryInfo.json" with { type: "json" }
import type { Country, CountryLanguage } from "@nexora/shared/types/country"

// Inhabited places countries-and-timezones leaves out. The uninhabited ones
// (Bouvet Island, Heard Island) keep an empty list.
const MISSING_TIMEZONES: Partial<Record<TCountryCode, string[]>> = {
  XK: ["Europe/Belgrade"],
  AC: ["Atlantic/St_Helena"],
  TA: ["Atlantic/St_Helena"],
}

const SUPPORTED_LANGUAGE_COUNT = 8

type LanguagePopulation = Record<string, { _populationPercent: string }>

const territories = territoryInfo.supplemental.territoryInfo as Record<
  string,
  { languagePopulation?: LanguagePopulation } | undefined
>

const englishNames = new Intl.DisplayNames(["en"], { type: "language" })

/** Names from the runtime's CLDR data, e.g. "zh-Hant" → "Traditional Chinese". */
const toLanguage = (code: string): CountryLanguage => {
  const name = englishNames.of(code) ?? code
  let nativeName = name
  try {
    nativeName =
      new Intl.DisplayNames([code], { type: "language" }).of(code) ?? name
  } catch {
    // No locale data for the language itself; English it is.
  }
  return { code, name, nativeName }
}

/**
 * The country's most spoken languages by share of the population, from
 * CLDR, e.g. India: Hindi, English, Bengali, Telugu, Marathi. Codes are BCP
 * 47 ("zh-Hant"); one per base language, so Serbian in two scripts counts
 * once. The default language is always kept, in place of the last one if
 * it didn't make the cut.
 */
const getSupportedLanguages = (
  code: string,
  defaultLanguage: string | null
): CountryLanguage[] => {
  const population = territories[code]?.languagePopulation ?? {}
  const seenBases = new Set<string>()

  const codes = Object.entries(population)
    .sort(
      ([, a], [, b]) =>
        parseFloat(b._populationPercent) - parseFloat(a._populationPercent)
    )
    .map(([language]) => language.replace("_", "-"))
    .filter((language) => {
      const base = language.split("-")[0]!
      // "und" is CLDR's "unknown language", e.g. for Antarctica.
      if (base === "und" || seenBases.has(base)) return false
      seenBases.add(base)
      return true
    })
    .slice(0, SUPPORTED_LANGUAGE_COUNT)

  // Compared by base, so Taiwan's "zh" default doesn't add a second Chinese
  // next to CLDR's "zh-Hant".
  const baseOf = (language: string) => language.split("-")[0]!
  if (
    defaultLanguage &&
    !codes.some((language) => baseOf(language) === baseOf(defaultLanguage))
  ) {
    codes.splice(SUPPORTED_LANGUAGE_COUNT - 1, 1, defaultLanguage)
  }

  return codes.map(toLanguage)
}

// Static data, so it's built once at startup rather than per request.
const COUNTRIES: Country[] = (Object.keys(countries) as TCountryCode[])
  .map((code) => {
    const country = countries[code]
    const countryLanguages = country.languages.map((languageCode) => ({
      code: languageCode,
      name: languages[languageCode].name,
      nativeName: languages[languageCode].native,
    }))
    const defaultLanguage = countryLanguages[0]?.code ?? null

    return {
      code,
      name: country.name,
      nativeName: country.native,
      flag: getEmojiFlag(code),
      phoneCodes: country.phone.map((phone) => `+${phone}`),
      defaultLanguage,
      languages: countryLanguages,
      supportedLanguages: getSupportedLanguages(code, defaultLanguage),
      timezones: getCountry(code)?.timezones ?? MISSING_TIMEZONES[code] ?? [],
      continent: country.continent,
      capital: country.capital,
      currencies: country.currency,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, "en"))

export const countryService = {
  listCountries(): Country[] {
    return COUNTRIES
  },
}
