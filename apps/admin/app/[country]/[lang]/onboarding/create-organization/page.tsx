import CreateOrganizationForm from "@/features/onboarding/create-organization/create-organization-form"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { getSupportedCountries } from "@/lib/api/auth/countries"
import { getCreateOrganizationFormDetails } from "@/lib/api/onboarding/create-organization-request-get"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface CreateOrganizationPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: CreateOrganizationPageProps) =>
  onboardingMetadata(params, "createOrganization")

const CreateOrganizationFormWithCountries = async () => {
  const [countries, createOrganizationFormDetails] = await Promise.all([
    getSupportedCountries(),
    getCreateOrganizationFormDetails(),
  ])

  return (
    <CreateOrganizationForm
      countries={countries}
      createOrganizationFormDetails={createOrganizationFormDetails}
    />
  )
}

const CreateOrganizationPage = ({ params }: CreateOrganizationPageProps) => (
  <OnboardingPageGuard params={params} page="createOrganization">
    <CreateOrganizationFormWithCountries />
  </OnboardingPageGuard>
)

export default CreateOrganizationPage
