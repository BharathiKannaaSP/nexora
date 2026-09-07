import { OnboardingGuard } from "@/features/onboarding/components/onboarding-guard"
import OnboardingSidebar from "@/features/onboarding/components/onboarding-sidebar"
import OnboardingStepper from "@/features/onboarding/components/onboarding-stepper"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingGuard>
      <div className="min-h-screen bg-background">
        <div className="mx-auto grid w-full grid-cols-1 md:min-h-screen md:grid-cols-4">
          {/* Stepper */}
          <aside className="order-1 px-4 py-2 md:order-1 md:col-span-1 md:px-6 md:py-6">
            <OnboardingStepper />
          </aside>

          {/* Content */}
          <main className="order-2 px-4 py-2 md:col-span-2 md:px-10 md:py-8">
            <div>{children}</div>
          </main>

          {/* Sidebar */}
          <aside className="order-3 px-4 py-2 md:col-span-1 md:px-6 md:py-8">
            <OnboardingSidebar />
          </aside>
        </div>
      </div>
    </OnboardingGuard>
  )
}
