import CreateOrganizationForm from "@/features/onboarding/create-organization/create-organization-form"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { getCountries } from "@/lib/api/auth/countries"
import { isCountry } from "@/lib/i18n/config"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface CreateOrganizationPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: CreateOrganizationPageProps) =>
  onboardingMetadata(params, "createOrganization")

const CreateOrganizationFormWithCountries = async () => {
  const result = await getCountries()

  if (!result.success) {
    throw new Error(`Failed to load countries: ${result.code}`)
  }

  const countries = result.data.countries.filter(({ code }) =>
    isCountry(code.toLowerCase())
  )

  return <CreateOrganizationForm countries={countries} />
}


const CreateOrganizationPage = ({ params }: CreateOrganizationPageProps) => (
  <OnboardingPageGuard params={params} page="createOrganization">
    <CreateOrganizationFormWithCountries />
  </OnboardingPageGuard>
)

export default CreateOrganizationPage
