// `data` of the world country list. Not the countries Nexora is offered in;
// this is every country, for profile fields like country, phone, language
// and time zone.

export interface CountryLanguage {
  /** ISO 639-1, e.g. "ta" */
  code: string
  /** In English, e.g. "Tamil" */
  name: string
  /** In the language itself, e.g. "தமிழ்" */
  nativeName: string
}

export interface Country {
  /** ISO 3166-1 alpha-2, uppercase, e.g. "IN" */
  code: string
  /** In English, e.g. "India" */
  name: string
  /** In the country's main language, e.g. "भारत" */
  nativeName: string
  flag: string
  /** With the leading "+", e.g. ["+91"]; some countries have several. */
  phoneCodes: string[]
  /** The first of `languages`, or null when the country lists none. */
  defaultLanguage: string | null
  /** Official languages. */
  languages: CountryLanguage[]
  /**
   * Up to 8 most spoken languages, most spoken first, always including
   * `defaultLanguage`. Codes are BCP 47, e.g. "zh-Hant".
   */
  supportedLanguages: CountryLanguage[]
  /** IANA names, e.g. ["Asia/Kolkata"] */
  timezones: string[]
  /** e.g. "AS" for Asia */
  continent: string
  capital: string
  /** ISO 4217, e.g. ["INR"] */
  currencies: string[]
}

/** GET /auth/countries */
export interface CountriesResponseData {
  countries: Country[]
}
