"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * False during SSR and the hydration render, true afterwards. Use it to defer
 * output the server can't reproduce exactly, e.g. Intl date formatting, where
 * Node's ICU data can differ from the browser's ("PM" vs "오후" in ko).
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
