import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface JoinOrganizationPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: JoinOrganizationPageProps) =>
  onboardingMetadata(params, "joinOrganization")

const JoinOrganizationPage = ({ params }: JoinOrganizationPageProps) => (
  <OnboardingPageGuard params={params} page="joinOrganization" />
)

export default JoinOrganizationPage
