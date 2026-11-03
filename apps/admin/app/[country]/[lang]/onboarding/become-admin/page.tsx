import BecomeAdminForm from "@/features/onboarding/become-admin/become-admin-form"
import type { ApiResult } from "@/lib/api/result"
import type { BecomeAdminFormDetailsResponseData } from "@nexora/shared/types/onboarding"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { getCountries } from "@/lib/api/auth/countries"
import { getBecomeAdminFormDetails } from "@/lib/api/onboarding/become-admin-get"
import { isCountry } from "@/lib/i18n/config"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface BecomeAdminPageProps {
  params: Promise<LocaleParams>
}

const BecomeAdminWithCountries = async () => {
  const result = await getCountries()
  const becomeAdminFormDetails = await getBecomeAdminFormDetails()

  if (!result.success) {
    throw new Error(`Failed to load countries: ${result.code}`)
  }

  if (!becomeAdminFormDetails.success) {
    throw new Error(
      `Failed to load become admin form details: ${becomeAdminFormDetails.code}`
    )
  }

  const countries = result.data.countries.filter(({ code }) =>
    isCountry(code.toLowerCase())
  )

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
