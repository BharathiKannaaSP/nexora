import { OnboardingGuard } from "@/features/onboarding/components/onboarding-guard"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <OnboardingGuard>{children}</OnboardingGuard>
}
