import type { Metadata, Viewport } from "next"

export const siteConfig = {
  name: "Nexora",
  description:
    "Manage your fashion business — products, orders and team, all in one place.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
}

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "fashion",
    "admin portal",
    "product management",
    "order management",
    "team management",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

export const siteViewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}
