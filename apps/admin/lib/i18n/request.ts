import { getRequestConfig } from "next-intl/server"
import { isLocale } from "./config"
import { loadMessages } from "./messages"

export default getRequestConfig(async ({ locale }) => {
  // The locale comes from the /[country]/[lang] URL, so callers must pass it
  // explicitly, e.g. getTranslations({ locale: lang, namespace: "auth" }).
  if (!locale || !isLocale(locale)) {
    throw new Error(
      `next-intl was called without a supported locale (received "${locale}"). ` +
        "Pass { locale } explicitly to next-intl server functions."
    )
  }

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
