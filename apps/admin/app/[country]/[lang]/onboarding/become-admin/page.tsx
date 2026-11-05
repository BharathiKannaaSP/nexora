import BecomeAdminForm from "@/features/onboarding/become-admin/become-admin-form"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { getSupportedCountries } from "@/lib/api/auth/countries"
import { getBecomeAdminFormDetails } from "@/lib/api/onboarding/become-admin-get"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface BecomeAdminPageProps {
  params: Promise<LocaleParams>
}

const BecomeAdminWithCountries = async () => {
  const [countries, becomeAdminFormDetails] = await Promise.all([
    getSupportedCountries(),
    getBecomeAdminFormDetails(),
  ])

  if (!becomeAdminFormDetails.success) {
    throw new Error(
      `Failed to load become admin form details: ${becomeAdminFormDetails.code}`
    )
  }

  return (
    <BecomeAdminForm
      countries={countries}
      becomeAdminFormDetails={becomeAdminFormDetails}
    />
  )
}

export const generateMetadata = ({ params }: BecomeAdminPageProps) =>
  onboardingMetadata(params, "becomeAdmin")

const BecomeAdminPage = async ({ params }: BecomeAdminPageProps) => (
  <OnboardingPageGuard params={params} page="becomeAdmin">
    <BecomeAdminWithCountries />
  </OnboardingPageGuard>
)

export default BecomeAdminPage
