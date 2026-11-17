import { Skeleton } from "@nexora/ui/components/skeleton"

interface DataTableSkeletonProps {
  columns: number
  rows?: number
}

export const DataTableSkeleton = ({
  columns,
  rows = 5,
}: DataTableSkeletonProps) => (
  <div className="overflow-hidden rounded-lg border" aria-hidden="true">
    <div className="flex gap-4 border-b bg-muted/50 px-4 py-3">
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} className="h-3 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, row) => (
      <div
        key={row}
        className="flex items-center gap-4 border-b px-4 py-5 last:border-0"
      >
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)
