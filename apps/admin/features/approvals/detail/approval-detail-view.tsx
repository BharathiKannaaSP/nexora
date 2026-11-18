import { isOpenApprovalStatus } from "@nexora/schemas/onboarding/approvals"
import type { ApprovalDetail } from "@nexora/shared/types/approvals"

import { withSearchParams } from "@/lib/url/search-params"

import { ApprovalAccessSummary } from "./approval-access-summary"
import { ApprovalAdditionalInfo } from "./approval-additional-info"
import { ApprovalDecisionBar } from "./approval-decision-bar"
import {
  APPROVAL_TAB_PARAM,
  type ApprovalDetailTab,
} from "./approval-detail-config"
import { ApprovalDetailHeader } from "./approval-detail-header"
import { ApprovalDetailTabs } from "./approval-detail-tabs"
import { ApprovalOverview } from "./approval-overview"
import { ApprovalProgress } from "./approval-progress"

interface ApprovalDetailViewProps {
  approval: ApprovalDetail
  tab: ApprovalDetailTab
  /** Localized: this request's page, the list, and the list on its type. */
  basePath: string
  listHref: string
  typeListHref: string
}

export const ApprovalDetailView = ({
  approval,
  tab,
  basePath,
  listHref,
  typeListHref,
}: ApprovalDetailViewProps) => (
  <>
    <ApprovalDetailHeader
      approval={approval}
      listHref={listHref}
      typeListHref={typeListHref}
    />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <ApprovalOverview approval={approval} />
          <ApprovalDetailTabs
            approval={approval}
            tab={tab}
            basePath={basePath}
          />
        </div>
        <ApprovalAccessSummary
          approval={approval}
          accessHref={withSearchParams(basePath, {
            [APPROVAL_TAB_PARAM]: "access",
          })}
        />
      </div>
      <div className="flex flex-col gap-6">
        <ApprovalProgress approval={approval} />
        <ApprovalAdditionalInfo approval={approval} />
      </div>
    </div>
    {isOpenApprovalStatus(approval.status) && (
      <ApprovalDecisionBar type={approval.type} id={approval.id} />
    )}
  </>
)
