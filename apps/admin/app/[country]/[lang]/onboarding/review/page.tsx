import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import OnboardingReview from "@/features/onboarding/review/onboarding-review"
import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"
import { getBecomeAdminFormDetails } from "@/lib/api/onboarding/become-admin-get"
import { getCreateOrganizationFormDetails } from "@/lib/api/onboarding/create-organization-request-get"
import { getJoinOrganizationFormDetails } from "@/lib/api/onboarding/join-organization-request-get"
import { getDirectoryEntry } from "@/lib/api/organization/get-directory-entry"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

interface ReviewPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: ReviewPageProps) =>
  onboardingMetadata(params, "review")

// Every path saves a request of its own; without one the review shows what
// the onboarding record holds. bootstrap() is cached per request, so this
// shares the guard's fetch.
const OnboardingReviewWithRequest = async ({
  params,
}: {
  params: Promise<LocaleParams>
}) => {
  const { country, lang } = await resolveLocaleParams(params)
  const { onboarding } = await bootstrap(country, lang)

  if (onboarding?.selectedPath === "BECOME_ADMIN") {
    const result = await getBecomeAdminFormDetails()

    if (!result.success) {
      throw new Error(`Failed to load become admin request: ${result.code}`)
    }

    return (
      <OnboardingReview adminAccessRequest={result.data.adminAccessRequest} />
    )
  }

  if (onboarding?.selectedPath === "CREATE_ORGANIZATION") {
    const result = await getCreateOrganizationFormDetails()

    if (!result.success) {
      throw new Error(
        `Failed to load create organization request: ${result.code}`
      )
    }

    return (
      <OnboardingReview
        organizationRequest={result.data.createOrganizationFormDetails}
      />
    )
  }

  if (onboarding?.selectedPath === "JOIN_ORGANIZATION") {
    const result = await getJoinOrganizationFormDetails()

    if (!result.success) {
      throw new Error(
        `Failed to load join organization request: ${result.code}`
      )
    }

    const request = result.data.joinOrganizationFormDetails
    // Only shown by name; the request still reviews without it.
    const organization = request?.organizationId
      ? await getDirectoryEntry(request.organizationId)
      : null

    return (
      <OnboardingReview
        joinRequest={request}
        joinOrganization={
          organization?.success ? organization.data.organization : null
        }
      />
    )
  }

  return <OnboardingReview />
}

const ReviewPage = ({ params }: ReviewPageProps) => (
  <OnboardingPageGuard params={params} page="review">
    <OnboardingReviewWithRequest params={params} />
  </OnboardingPageGuard>
)

export default ReviewPage
