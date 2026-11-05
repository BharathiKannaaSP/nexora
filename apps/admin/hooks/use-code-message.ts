"use client"

import { useTranslations } from "next-intl"
import { useCallback } from "react"

type CodeKey = Parameters<ReturnType<typeof useTranslations<"codes">>>[0]

/**
 * Translates a backend response code (locales/<lang>/codes.json). Codes like
 * "AUTH.REGISTER.SUCCESS" resolve as nested keys. Unknown codes become
 * UNKNOWN_ERROR, or undefined with `{ fallback: false }`.
 */
export function useCodeMessage() {
  const t = useTranslations("codes")

  return useCallback(
    (code: string, { fallback = true } = {}) => {
      const key = code as CodeKey
      if (t.has(key)) return t(key)
      return fallback ? t("UNKNOWN_ERROR") : undefined
    },
    [t]
  )
}
