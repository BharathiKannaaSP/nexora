"use client"

import { NextIntlClientProvider } from "next-intl"
import type { ComponentProps } from "react"

// Imported from a Client Component so next-intl uses the props passed here
// instead of resolving locale, messages and time zone from the request.
export function IntlProvider(
  props: ComponentProps<typeof NextIntlClientProvider>
) {
  return <NextIntlClientProvider {...props} />
}
