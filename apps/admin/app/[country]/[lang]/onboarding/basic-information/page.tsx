import { BasicInformationForm } from "@/features/onboarding/basic-information/basic-information-form"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface BasicInformationPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: BasicInformationPageProps) =>
  onboardingMetadata(params, "basicInformation")

const BasicInformationPage = ({ params }: BasicInformationPageProps) => (
  <OnboardingPageGuard params={params} page="basicInformation">
    <BasicInformationForm />
  </OnboardingPageGuard>
)

export default BasicInformationPage
