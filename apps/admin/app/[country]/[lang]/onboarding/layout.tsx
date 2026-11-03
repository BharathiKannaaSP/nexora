import Header from "@/components/common/header"
import OnboardingSidebar from "@/components/onboarding/onboarding-sidebar"
import OnboardingStepper from "@/components/onboarding/onboarding-stepper"
import { BootstrapProvider } from "@/features/bootstrap/bootstrap-provider"
import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import { ReactNode, Suspense } from "react"

interface OnboardingLayoutProps {
  children: ReactNode
  params: Promise<LocaleParams>
}

/**
 * The stepper sits outside each page's BootstrapGuard, so it gets its own
 * provider. bootstrap() is cached per request, so this shares the guard's
 * fetch.
 */
const OnboardingStepperSection = async ({
  params,
}: {
  params: Promise<LocaleParams>
}) => {
  const { country, lang } = await resolveLocaleParams(params)
  const overview = await bootstrap(country, lang)

  return (
    <BootstrapProvider overview={overview}>
      <OnboardingStepper />
    </BootstrapProvider>
  )
}

export const OnboardingLayout = async ({
  children,
  params,
}: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header params={params} />
      <div className="mx-auto grid w-full grid-cols-1 md:min-h-screen xl:grid-cols-4">
        <aside className="order-1 px-4 py-2 md:order-1 md:col-span-1 md:px-6 md:py-6 xl:sticky xl:top-16 xl:max-h-[calc(100vh-4rem)] xl:self-start xl:overflow-y-auto">
          <Suspense>
            <OnboardingStepperSection params={params} />
          </Suspense>
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
  )
}
export default OnboardingLayout
