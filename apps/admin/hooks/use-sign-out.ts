"use client"

import { useTransition } from "react"

import { logout } from "@/lib/api/auth/logout"

import { useLocaleParams } from "./use-locale-params"

/** Signs out, then the server sends the browser to sign-in. */
export function useSignOut() {
  const { country, lang } = useLocaleParams()
  const [isPending, startTransition] = useTransition()

  const signOut = () =>
    startTransition(async () => {
      await logout(country, lang)
    })

  return { signOut, isPending }
}
