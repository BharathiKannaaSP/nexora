import type { Country } from "@nexora/shared/types/country"

import type { SelectOption } from "@/components/forms/form-types"

// One collator for the whole sort; localeCompare(…, lang) builds one per call.
const byName = (lang: string) => {
  const collator = new Intl.Collator(lang)
  return (a: { name: string }, b: { name: string }) =>
    collator.compare(a.name, b.name)
}

/** e.g. "Inde" on /fr/fr; English when the runtime has no name. */
export const countryName = (regionNames: Intl.DisplayNames, country: Country) =>
  regionNames.of(country.code) ?? country.name

/**
 * `countries` as "🇮🇳 Inde" options valued by code, sorted by name in the
 * page's language. `extra` adds fields to each, e.g. `disabled`.
 */
export const toCountryOptions = (
  countries: Country[],
  { lang, regionNames }: { lang: string; regionNames: Intl.DisplayNames },
  extra?: (country: Country) => Partial<SelectOption>
): SelectOption[] =>
  countries
    .map((country) => ({
      name: countryName(regionNames, country),
      country,
    }))
    .sort(byName(lang))
    .map(({ name, country }) => ({
      value: country.code,
      label: `${country.flag} ${name}`,
      ...extra?.(country),
    }))

/**
 * Where a country field starts: the user's saved country if it can be
 * picked, else the URL's (/fr → France). Uppercased because older profiles
 * saved lowercase codes ("uy").
 */
export const findInitialCountry = (
  countries: Country[],
  savedCode: string | null | undefined,
  urlCountry: string
) => {
  const saved = savedCode?.toUpperCase()
  return (
    countries.find(({ code }) => code === saved) ??
    countries.find(({ code }) => code === urlCountry.toUpperCase())
  )
}
