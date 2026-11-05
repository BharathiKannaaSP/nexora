import ChooseYourPathForm from "@/features/onboarding/choose-your-path/choose-your-path-form"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { getSupportedCountries } from "@/lib/api/auth/countries"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface ChoosePathPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: ChoosePathPageProps) =>
  onboardingMetadata(params, "choosePath")

const ChooseYourPathFormWithCountries = async () => (
  <ChooseYourPathForm countries={await getSupportedCountries()} />
)

const ChoosePathPage = ({ params }: ChoosePathPageProps) => (
  <OnboardingPageGuard params={params} page="choosePath">
    <ChooseYourPathFormWithCountries />
  </OnboardingPageGuard>
)

export default ChoosePathPage
