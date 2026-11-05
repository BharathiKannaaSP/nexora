"use client"

import { useParams } from "next/navigation"

/** The current /[country]/[lang], for Client Components. */
export const useLocaleParams = () =>
  useParams<{ country: string; lang: string }>()
