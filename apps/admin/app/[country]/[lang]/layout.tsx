import "@nexora/ui/globals.css"
import {
  getDirection,
  isCountry,
  isCountryLanguage,
  isLocale,
  supportedCountries,
} from "@/lib/i18n/config"
import { siteMetadata, siteViewport } from "@/lib/metadata"
import { IntlProvider } from "@/providers/intl-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { Toaster } from "@nexora/ui/components/toast"
import { cn } from "@nexora/ui/lib/utils"
import type { Metadata, Viewport } from "next"
import { getMessages, getTimeZone, getTranslations } from "next-intl/server"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = siteMetadata
export const viewport: Viewport = siteViewport

// Request headers aren't available at build time, so every supported
// country/language pair is prerendered; proxy.ts picks the visitor's country.
export function generateStaticParams() {
  return supportedCountries.flatMap(({ code: country, languages }) =>
    languages.map(({ code: lang }) => ({ country, lang }))
  )
}

interface RootLayoutProps {
  children: ReactNode
  params: Promise<{ country: string; lang: string }>
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { country, lang } = await params
  if (!isLocale(lang)) notFound()
  if (!isCountry(country)) notFound()
  if (!isCountryLanguage(country, lang)) notFound()

  const [messages, timeZone, tCommon] = await Promise.all([
    getMessages({ locale: lang }),
    getTimeZone({ locale: lang }),
    getTranslations({ locale: lang, namespace: "common" }),
  ])

  return (
    <html
      lang={lang}
      dir={getDirection(lang)}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <IntlProvider locale={lang} messages={messages} timeZone={timeZone}>
            {children}
            <Toaster
              timeout={3000}
              position="top-right"
              closeLabel={tCommon("closeNotification")}
            />
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
