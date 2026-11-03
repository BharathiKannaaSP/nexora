"use client"
import {
  Banner,
  BannerDescription,
  BannerTitle,
} from "@nexora/ui/components/banner"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

const REGISTERED_STORAGE_KEY = "nexora.justRegistered"
const BANNER_VISIBLE_MS = 10_000 // 10 seconds

/**
 * Kept in sessionStorage rather than the URL so the banner shows once after
 * sign-up and doesn't come back on reload or when the link is shared.
 */
export function markJustRegistered() {
  try {
    sessionStorage.setItem(REGISTERED_STORAGE_KEY, "1")
  } catch {
    // Storage can be blocked (private mode); the banner is simply skipped.
  }
}

function consumeJustRegistered() {
  try {
    const value = sessionStorage.getItem(REGISTERED_STORAGE_KEY)
    sessionStorage.removeItem(REGISTERED_STORAGE_KEY)
    return value === "1"
  } catch {
    return false
  }
}

export const RegisteredBanner = () => {
  const t = useTranslations("auth.signIn.registered")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (consumeJustRegistered()) setVisible(true)
  }, [])

  // Separate from the read above: Strict Mode re-runs effects, and the flag
  // is already gone on the second run, so the timer must not depend on it.
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setVisible(false), BANNER_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [visible])

  if (!visible) return null

  return (
    <Banner variant="info" className="mt-6">
      <BannerTitle>{t("title")}</BannerTitle>
      <BannerDescription>{t("description")}</BannerDescription>
    </Banner>
  )
}
