import React from "react"

export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export type Layout = "mobile" | "tablet" | "desktop" | "wide"

function getLayout(width: number): Layout {
  if (width < BREAKPOINTS.md) return "mobile"
  if (width < BREAKPOINTS.lg) return "tablet"
  if (width < BREAKPOINTS.xl) return "desktop"
  return "wide"
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)

    const handleChange = () => {
      setMatches(mediaQuery.matches)
    }

    handleChange()

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return !!matches
}

export function useBreakpoint() {
  const [layout, setLayout] = React.useState<Layout | undefined>(undefined)

  React.useEffect(() => {
    const mediaQueries = Object.values(BREAKPOINTS).map((width) =>
      window.matchMedia(`(min-width: ${width}px)`)
    )

    const handleChange = () => {
      setLayout(getLayout(window.innerWidth))
    }

    handleChange()

    mediaQueries.forEach((mq) => mq.addEventListener("change", handleChange))

    return () => {
      mediaQueries.forEach((mq) =>
        mq.removeEventListener("change", handleChange)
      )
    }
  }, [])

  // Before mount (SSR / first render), default to desktop
  const current = layout ?? "desktop"

  return {
    layout: current,
    isMobile: current === "mobile",
    isTablet: current === "tablet",
    isDesktop: current === "desktop" || current === "wide",
    isWide: current === "wide",
  }
}

export function useMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`)
}

export function useTablet() {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  )
}

export function useDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}

export function useWide() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`)
}
