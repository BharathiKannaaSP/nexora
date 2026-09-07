"use client"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { api } from "@nexora/convex/convex/_generated/api"
import React, { useEffect } from "react"
import { useQuery } from "convex/react"
import { getOnboardingRoute } from "@/features/onboarding/utils/get-onboarding-route"

const AuthBootstrap = () => {
  const router = useRouter()
  const { isLoaded, isSignedIn, userId } = useAuth()
  console.log(userId)
  const onboarding = useQuery(api.onboarding.queries.getUserById)

  console.log(onboarding)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn || !userId) {
      router.replace("/sign-in")
    }
  }, [isLoaded, isSignedIn, userId, router])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      return
    }

    // Convex is still loading.
    if (onboarding === undefined) {
      return
    }

    // User exists in Clerk, but onboarding
    // hasn't been created by the backend yet.
    if (onboarding === null) {
      return
    }

    const route = getOnboardingRoute({
      status: onboarding.status,
      currentStep: onboarding.currentStep,
    })

    router.replace(route)
  }, [isLoaded, isSignedIn, userId, onboarding, router])

  if (!isLoaded) {
    return <BootstrapLoading />
  }

  if (!isSignedIn || !userId) {
    return <BootstrapLoading />
  }

  return <BootstrapLoading />
}

const BootstrapLoading = () => {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />

        <div>
          <h1 className="text-lg font-semibold">Setting up your account</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Please wait while we prepare your Nexora account.
          </p>
        </div>
      </div>
    </main>
  )
}

export default AuthBootstrap
