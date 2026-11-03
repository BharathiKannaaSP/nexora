"use client"

import { toast } from "@nexora/ui/components/toast"
import { useTranslations } from "next-intl"
import { useCallback } from "react"
import type { ApiResult } from "@/lib/api/result"

type CodeKey = Parameters<ReturnType<typeof useTranslations<"codes">>>[0]

/**
 * Translates a backend response code (locales/<lang>/codes.json) and shows it
 * as a toast. Codes like "AUTH.REGISTER.SUCCESS" resolve as nested keys.
 * Unknown codes fall back to UNKNOWN_ERROR on failure and are skipped on success.
 */
export function useApiToast() {
  const t = useTranslations("codes")

  return useCallback(
    <T>(result: ApiResult<T>) => {
      const code = result.code as CodeKey
      const known = t.has(code)

      if (result.success) {
        if (known) toast.add({ title: t(code), type: "success" })
        return
      }

      toast.add({
        title: t(known ? code : "UNKNOWN_ERROR"),
        type: "error",
      })
    },
    [t]
  )
}
