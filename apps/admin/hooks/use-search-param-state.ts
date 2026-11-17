"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

import type { SearchParamPatch } from "@/lib/url/search-params"

interface SetOptions {
  /** Drops `page`, since a new filter changes what page 1 is. Default true. */
  resetPage?: boolean
  /** "replace" for typing, so each keystroke isn't a history entry. */
  history?: "push" | "replace"
}

/**
 * Filters kept in the URL. `set` merges a patch into the current query
 * (null or "" removes a key) and navigates in a transition, so the server
 * re-renders with new data while `isPending` lets the UI dim.
 */
export const useSearchParamState = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const set = useCallback(
    (
      patch: SearchParamPatch,
      { resetPage = true, history = "push" }: SetOptions = {}
    ) => {
      const next = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }
      if (resetPage) next.delete("page")

      const query = next.toString()
      const url = query ? `${pathname}?${query}` : pathname
      startTransition(() => router[history](url, { scroll: false }))
    },
    [pathname, router, searchParams]
  )

  return { searchParams, set, isPending }
}
