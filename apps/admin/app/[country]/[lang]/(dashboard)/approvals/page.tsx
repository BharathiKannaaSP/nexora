import { ShieldOff } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { DashboardShell } from "@/components/common/layout/dashboard-shell"
import { EmptyState } from "@/components/common/page/empty-state"
import { PageHeader } from "@/components/common/page/page-header"
import { parseApprovalSearchParams } from "@/features/approvals/approval-search-params"
import {
  APPROVALS_PATH,
  visibleApprovalTypes,
} from "@/features/approvals/approval-types"
import { approvalsMetadata } from "@/features/approvals/approvals-metadata"
import { ApprovalsSkeleton } from "@/features/approvals/approvals-skeleton"
import { ApprovalsView } from "@/features/approvals/approvals-view"
import { listApprovals } from "@/lib/api/approvals/list-approvals"
import { getPermissions } from "@/lib/auth/get-permissions"
import { href, type Locale } from "@/lib/i18n/config"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"
import type { SearchParamsRecord } from "@/lib/url/search-params"

interface ApprovalsPageProps {
  params: Promise<LocaleParams>
  searchParams: Promise<SearchParamsRecord>
}

export const generateMetadata = ({ params }: ApprovalsPageProps) =>
  approvalsMetadata(params)

const ApprovalsContent = async ({
  country,
  lang,
  searchParams,
}: {
  country: string
  lang: Locale
  searchParams: SearchParamsRecord
}) => {
  const t = await getTranslations({ locale: lang, namespace: "approvals" })
  // The overview DashboardShell already loaded; no extra call.
  const types = visibleApprovalTypes(
    await getPermissions(country, lang),
    country
  )

  if (types.length === 0) {
    return (
      <EmptyState
        icon={ShieldOff}
        title={t("noAccess.title")}
        description={t("noAccess.description")}
      />
    )
  }

  const filters = parseApprovalSearchParams(searchParams, types, country)
  const result = await listApprovals(filters)

  if (!result.success) {
    // error.tsx shows the retry screen.
    throw new Error(`Failed to load approvals: ${result.code}`)
  }

  return (
    <ApprovalsView
      data={result.data}
      filters={filters}
      types={types}
      basePath={href(country, lang, APPROVALS_PATH)}
    />
  )
}

// searchParams is request-time data, so it's awaited here, under the page's
// Suspense, rather than in the page: the header stays in the prerendered shell.
const ApprovalsResults = async ({
  country,
  lang,
  searchParams,
}: {
  country: string
  lang: Locale
  searchParams: Promise<SearchParamsRecord>
}) => {
  const query = await searchParams

  return (
    // Not keyed on the query: a key would remount the filters on every change
    // and drop focus from the search box. Filter navigations run in a
    // transition, so the current results stay up until the new ones arrive.
    <Suspense fallback={<ApprovalsSkeleton />}>
      <ApprovalsContent country={country} lang={lang} searchParams={query} />
    </Suspense>
  )
}

const ApprovalsPage = async ({ params, searchParams }: ApprovalsPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "approvals" })

  return (
    <DashboardShell country={country} lang={lang}>
      <PageHeader
        title={t("metadata.title")}
        description={t("metadata.description")}
      />
      <Suspense fallback={<ApprovalsSkeleton />}>
        <ApprovalsResults
          country={country}
          lang={lang}
          searchParams={searchParams}
        />
      </Suspense>
    </DashboardShell>
  )
}

export default ApprovalsPage
