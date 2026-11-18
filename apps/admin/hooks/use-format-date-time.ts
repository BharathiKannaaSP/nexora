"use client"

import { useFormatter } from "next-intl"
import { useCallback } from "react"

import { useHydrated } from "./use-hydrated"

/**
 * Formats an ISO timestamp as date and time, on the client only: Node's ICU
 * data can disagree with the browser's (e.g. "PM" vs "오후"), which breaks
 * hydration. Empty until hydrated.
 */
export function useFormatDateTime() {
  const format = useFormatter()
  const hydrated = useHydrated()

  return useCallback(
    (value: string) =>
      hydrated
        ? format.dateTime(new Date(value), {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "",
    [format, hydrated]
  )
}
