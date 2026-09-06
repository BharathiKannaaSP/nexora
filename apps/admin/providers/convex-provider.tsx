"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

interface ConvexProviderProps {
  children: ReactNode
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured")
}

const convex = new ConvexReactClient(convexUrl)

export const ConvexClientProvider = ({ children }: ConvexProviderProps) => {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
