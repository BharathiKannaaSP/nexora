import JoinOrganizationForm from "@/features/onboarding/join-organization/join-organization-form"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { getJoinOrganizationFormDetails } from "@/lib/api/onboarding/join-organization-request-get"
import { getDirectoryEntry } from "@/lib/api/organization/get-directory-entry"
import { searchOrganizations } from "@/lib/api/organization/search-organizations"
import type { LocaleParams } from "@/lib/i18n/locale-params"

interface JoinOrganizationPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: JoinOrganizationPageProps) =>
  onboardingMetadata(params, "joinOrganization")

const JoinOrganizationFormWithDirectory = async () => {
  const [joinOrganizationFormDetails, directory] = await Promise.all([
    getJoinOrganizationFormDetails(),
    searchOrganizations(),
  ])

  // The saved request's organization, which may not be on the first page.
  const organizationId = joinOrganizationFormDetails.success
    ? joinOrganizationFormDetails.data.joinOrganizationFormDetails
        ?.organizationId
    : null
  const savedEntry = organizationId
    ? await getDirectoryEntry(organizationId)
    : null

  return (
    <JoinOrganizationForm
      joinOrganizationFormDetails={joinOrganizationFormDetails}
      directory={directory}
      savedOrganization={
        savedEntry?.success ? savedEntry.data.organization : null
      }
    />
  )
}

const JoinOrganizationPage = ({ params }: JoinOrganizationPageProps) => (
  <OnboardingPageGuard params={params} page="joinOrganization">
    <JoinOrganizationFormWithDirectory />
  </OnboardingPageGuard>
)

export default JoinOrganizationPage
