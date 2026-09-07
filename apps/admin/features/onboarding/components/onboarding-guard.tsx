"use client"

import { api } from "@nexora/convex/convex/_generated/api"
import { useAuth } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useEffect } from "react"

import { getOnboardingRoute } from "@/features/onboarding/utils/get-onboarding-route"
import Spinner from "@workspace/ui/components/spinner"

interface OnboardingGuardProps {
  children: React.ReactNode
}

export const OnboardingGuard = ({ children }: OnboardingGuardProps) => {
  const router = useRouter()
  const pathname = usePathname()

  const { isLoaded, isSignedIn, userId } = useAuth()

  const onboarding = useQuery(api.onboarding.queries.getUserById)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn || !userId) {
      router.replace("/sign-in")
      return
    }

    if (onboarding === undefined) {
      return
    }

    if (onboarding === null) {
      return
    }

    const expectedRoute = getOnboardingRoute({
      status: onboarding.status,
      currentStep: onboarding.currentStep,
    })

    if (pathname !== expectedRoute) {
      router.replace(expectedRoute)
    }
  }, [isLoaded, isSignedIn, userId, onboarding, pathname, router])

  if (!isLoaded || !isSignedIn || !userId) {
    return <OnboardingLoading />
  }

  if (onboarding === undefined) {
    return <OnboardingLoading />
  }

  if (onboarding === null) {
    return <OnboardingLoading />
  }

  const expectedRoute = getOnboardingRoute({
    status: onboarding.status,
    currentStep: onboarding.currentStep,
  })

  if (pathname !== expectedRoute) {
    return <OnboardingLoading />
  }

  return children
}

const OnboardingLoading = () => {
  return <Spinner />
}
