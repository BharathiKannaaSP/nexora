import type {
  ApprovalPriority,
  ApprovalStatus,
} from "@nexora/schemas/onboarding/approvals"

import type { StatusConfig } from "@/components/common/badges/status-badge"

export const APPROVAL_STATUS_CONFIG: StatusConfig<ApprovalStatus> = {
  PENDING: { tone: "brand" },
  UNDER_REVIEW: { tone: "info" },
  APPROVED: { tone: "success" },
  REJECTED: { tone: "danger" },
  WITHDRAWN: { tone: "neutral" },
}

export const APPROVAL_PRIORITY_CONFIG: StatusConfig<ApprovalPriority> = {
  HIGH: { tone: "danger" },
  MEDIUM: { tone: "warning" },
  LOW: { tone: "success" },
}
