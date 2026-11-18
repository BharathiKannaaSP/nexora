import { ShieldOff } from "lucide-react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { DashboardShell } from "@/components/common/layout/dashboard-shell"
import { EmptyState } from "@/components/common/page/empty-state"
import {
  APPROVAL_TYPES,
  APPROVALS_PATH,
  approvalsListPath,
  approvalTypeFromSlug,
  visibleApprovalTypes,
} from "@/features/approvals/approval-types"
import { parseApprovalDetailTab } from "@/features/approvals/detail/approval-detail-config"
import { ApprovalDetailSkeleton } from "@/features/approvals/detail/approval-detail-skeleton"
import { ApprovalDetailView } from "@/features/approvals/detail/approval-detail-view"
import { getApproval } from "@/lib/api/approvals/get-approval"
import { getPermissions } from "@/lib/auth/get-permissions"
import { href, type Locale } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import type { SearchParamsRecord } from "@/lib/url/search-params"

interface ApprovalParams extends LocaleParams {
  slug: string
  id: string
}

interface ApprovalPageProps {
  params: Promise<ApprovalParams>
  searchParams: Promise<SearchParamsRecord>
}

export const generateMetadata = async ({
  params,
}: ApprovalPageProps): Promise<Metadata> => {
  const { lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "approvals" })
  return { title: t("detail.metadata.title") }
}

// Not-found responses: someone else's request, a bad id, a gone request.
const NOT_FOUND_CODES = ["APPROVAL_NOT_FOUND", "VALIDATION_ERROR"]

const ApprovalContent = async ({
  country,
  lang,
  params,
  searchParams,
}: {
  country: string
  lang: Locale
  params: Promise<ApprovalParams>
  searchParams: Promise<SearchParamsRecord>
}) => {
  const [{ slug, id }, query] = await Promise.all([params, searchParams])

  const type = approvalTypeFromSlug(slug)
  if (!type) notFound()

  const t = await getTranslations({ locale: lang, namespace: "approvals" })
  // The overview DashboardShell already loaded; no extra call.
  const types = visibleApprovalTypes(
    await getPermissions(country, lang),
    country
  )

  if (!types.includes(type)) {
    return (
      <EmptyState
        icon={ShieldOff}
        title={t("forbidden.title")}
        description={t("forbidden.description")}
      />
    )
  }

  // The country is checked server-side too: a request of the reviewer's
  // opened under a country it doesn't belong to is forbidden (403).
  const result = await getApproval({ type, id }, { country })

  if (!result.success) {
    if (result.code === "APPROVAL_COUNTRY_FORBIDDEN") {
      return (
        <EmptyState
          icon={ShieldOff}
          title={t("forbidden.title")}
          description={t("forbidden.otherCountry")}
        />
      )
    }
    if (result.status === 404 || NOT_FOUND_CODES.includes(result.code)) {
      notFound()
    }
    // error.tsx shows the retry screen.
    throw new Error(`Failed to load approval: ${result.code}`)
  }

  return (
    <ApprovalDetailView
      approval={result.data.approval}
      tab={parseApprovalDetailTab(query)}
      basePath={href(country, lang, APPROVAL_TYPES[type].detailPath(id))}
      listHref={href(country, lang, APPROVALS_PATH)}
      typeListHref={href(country, lang, approvalsListPath(type))}
    />
  )
}

// [slug] and [id] aren't known at build time, so even the locale (read from
// the same params) is awaited under Suspense.
const ApprovalPageBody = async ({
  params,
  searchParams,
}: ApprovalPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)

  return (
    <DashboardShell country={country} lang={lang}>
      <Suspense fallback={<ApprovalDetailSkeleton />}>
        <ApprovalContent
          country={country}
          lang={lang}
          params={params}
          searchParams={searchParams}
        />
      </Suspense>
    </DashboardShell>
  )
}

const ApprovalPage = (props: ApprovalPageProps) => (
  <Suspense>
    <ApprovalPageBody {...props} />
  </Suspense>
)

export default ApprovalPage
