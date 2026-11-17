import { DataTableSkeleton } from "@/components/common/data-table/data-table-skeleton"
import { PageSection } from "@/components/common/page/page-section"
import { StatCardGrid } from "@/components/common/stats/stat-card-grid"
import { StatCardSkeleton } from "@/components/common/stats/stat-card-skeleton"

export const ApprovalsSkeleton = () => (
  <>
    <StatCardGrid>
      {Array.from({ length: 5 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </StatCardGrid>
    <PageSection>
      <DataTableSkeleton columns={8} />
    </PageSection>
  </>
)
