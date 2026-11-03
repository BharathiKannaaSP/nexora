import OnboardingReview from "@/features/onboarding/review/onboarding-review"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"
import { getBecomeAdminFormDetails } from "@/lib/api/onboarding/become-admin-get"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

interface ReviewPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: ReviewPageProps) =>
  onboardingMetadata(params, "review")

// BECOME_ADMIN saves a request of its own; the other paths show what the onboarding record holds. bootstrap() is cached
// per request, so this shares the guard's fetch.
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

  return <OnboardingReview />
}

const ReviewPage = ({ params }: ReviewPageProps) => (
  <OnboardingPageGuard params={params} page="review">
    <OnboardingReviewWithRequest params={params} />
  </OnboardingPageGuard>
)

export default ReviewPage
