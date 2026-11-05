"use client"

import { useEffect, useState } from "react"

/**
 * A blob: URL for a local file, revoked when the file changes or the
 * component unmounts. Made in the effect (not useMemo) so Strict Mode's
 * extra cleanup can't revoke a URL that's still shown.
 */
export const useObjectUrl = (file: Blob | undefined) => {
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!file) return
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
      setUrl(undefined)
    }
  }, [file])

  return file ? url : undefined
}
