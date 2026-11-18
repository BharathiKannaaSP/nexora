import { Skeleton } from "@nexora/ui/components/skeleton"

import { PageSection } from "@/components/common/page/page-section"

const Lines = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} className="h-5 w-full" />
    ))}
  </div>
)

export const ApprovalDetailSkeleton = () => (
  <>
    <Skeleton className="h-24 w-full rounded-xl" />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <PageSection>
          <Lines count={8} />
        </PageSection>
        <PageSection>
          <Lines count={8} />
        </PageSection>
      </div>
      <div className="flex flex-col gap-6">
        <PageSection>
          <Lines count={4} />
        </PageSection>
        <PageSection>
          <Lines count={5} />
        </PageSection>
      </div>
    </div>
  </>
)
