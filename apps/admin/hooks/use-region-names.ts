"use client"

import { useMemo } from "react"

/**
 * Country names in `lang`, e.g. "Inde" for "IN" in French. Made once per
 * language, since building one is costly.
 */
export const useRegionNames = (lang: string) =>
  useMemo(() => new Intl.DisplayNames([lang], { type: "region" }), [lang])
