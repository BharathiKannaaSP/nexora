"use client"

import { useCallback } from "react"

import { toast } from "@nexora/ui/components/toast"

import type { ApiResult } from "@/lib/api/result"

import { useCodeMessage } from "./use-code-message"

/**
 * Shows a response's translated code (see useCodeMessage()) as a toast.
 * Unknown codes fall back to UNKNOWN_ERROR on failure and are skipped on
 * success.
 */
export function useApiToast() {
  const codeMessage = useCodeMessage()

  return useCallback(
    <T>(result: ApiResult<T>) => {
      if (result.success) {
        const title = codeMessage(result.code, { fallback: false })
        if (title) toast.add({ title, type: "success" })
        return
      }

      toast.add({ title: codeMessage(result.code), type: "error" })
    },
    [codeMessage]
  )
}
