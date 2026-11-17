import { Skeleton } from "@nexora/ui/components/skeleton"

export const StatCardSkeleton = () => (
  <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
    <Skeleton className="size-12 rounded-xl" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-6 w-1/3" />
    </div>
  </div>
)
