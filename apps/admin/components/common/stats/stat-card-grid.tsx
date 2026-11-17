import type { ReactNode } from "react"

export const StatCardGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-6">
    {children}
  </div>
)
