"use client"

import { useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
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
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
