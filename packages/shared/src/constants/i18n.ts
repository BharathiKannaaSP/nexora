export const DEFAULT_LOCALE = "en"

export const DEFAULT_COUNTRY = "in"

export const RTL_LOCALES: ReadonlySet<string> = new Set(["ar"])

// Set by Vercel's edge network from the visitor's IP address.
export const COUNTRY_HEADER = "x-vercel-ip-country"
// The countries Nexora is offered in, each with the languages the admin app
// is translated into there. Not the world country list (GET /auth/countries).
export const SUPPORTED_COUNTRIES = [
  {
    name: "India",
    code: "in",
    defaultLanguage: "en",
    languages: [
      { language: "தமிழ் (Tamil)", code: "ta" },
      { language: "English", code: "en" },
      { language: "മലയാളം (Malayalam)", code: "ml" },
      { language: "ಕನ್ನಡ (Kannada)", code: "kn" },
      { language: "हिन्दी (Hindi)", code: "hi" },
    ],
  },
  {
    name: "France",
    code: "fr",
    defaultLanguage: "fr",
    languages: [
      { language: "Français (French)", code: "fr" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Germany",
    code: "de",
    defaultLanguage: "de",
    languages: [
      { language: "Deutsch (German)", code: "de" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Saudi Arabia",
    code: "sa",
    defaultLanguage: "ar",
    languages: [
      { language: "العربية (Arabic)", code: "ar" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Japan",
    code: "jp",
    defaultLanguage: "ja",
    languages: [
      { language: "日本語 (Japanese)", code: "ja" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "China",
    code: "cn",
    defaultLanguage: "zh",
    languages: [
      { language: "中文 (Chinese)", code: "zh" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Spain",
    code: "es",
    defaultLanguage: "es",
    languages: [
      { language: "Español (Spanish)", code: "es" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "United States",
    code: "us",
    defaultLanguage: "en",
    languages: [
      { language: "English", code: "en" },
      { language: "Español (Spanish)", code: "es" },
    ],
  },
  {
    name: "United Kingdom",
    code: "gb",
    defaultLanguage: "en",
    languages: [{ language: "English", code: "en" }],
  },
  {
    name: "United Arab Emirates",
    code: "ae",
    defaultLanguage: "ar",
    languages: [
      { language: "العربية (Arabic)", code: "ar" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Canada",
    code: "ca",
    defaultLanguage: "en",
    languages: [
      { language: "English", code: "en" },
      { language: "Français (French)", code: "fr" },
    ],
  },
  {
    name: "Australia",
    code: "au",
    defaultLanguage: "en",
    languages: [{ language: "English", code: "en" }],
  },
  {
    name: "Italy",
    code: "it",
    defaultLanguage: "it",
    languages: [
      { language: "Italiano (Italian)", code: "it" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Netherlands",
    code: "nl",
    defaultLanguage: "nl",
    languages: [
      { language: "Nederlands (Dutch)", code: "nl" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Singapore",
    code: "sg",
    defaultLanguage: "en",
    languages: [
      { language: "English", code: "en" },
      { language: "中文 (Chinese)", code: "zh" },
    ],
  },
  {
    name: "Malaysia",
    code: "my",
    defaultLanguage: "ms",
    languages: [
      { language: "Bahasa Melayu (Malay)", code: "ms" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "South Korea",
    code: "kr",
    defaultLanguage: "ko",
    languages: [
      { language: "한국어 (Korean)", code: "ko" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Brazil",
    code: "br",
    defaultLanguage: "pt",
    languages: [
      { language: "Português (Portuguese)", code: "pt" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Mexico",
    code: "mx",
    defaultLanguage: "es",
    languages: [
      { language: "Español (Spanish)", code: "es" },
      { language: "English", code: "en" },
    ],
  },
  {
    name: "Switzerland",
    code: "ch",
    defaultLanguage: "de",
    languages: [
      { language: "Deutsch (German)", code: "de" },
      { language: "Français (French)", code: "fr" },
      { language: "Italiano (Italian)", code: "it" },
      { language: "English", code: "en" },
    ],
  },
] as const

/**
 * The closest supported /country/lang pair: an unsupported country becomes
 * DEFAULT_COUNTRY, and a language the country isn't offered in becomes its
 * default, so links built from the pair (e.g. in emails) never 404.
 */
export function toSupportedCountryLocale(country: string, locale: string) {
  const supported =
    SUPPORTED_COUNTRIES.find(({ code }) => code === country) ??
    SUPPORTED_COUNTRIES.find(({ code }) => code === DEFAULT_COUNTRY)!

  return {
    country: supported.code as string,
    locale: supported.languages.some(({ code }) => code === locale)
      ? locale
      : (supported.defaultLanguage as string),
  }
}
