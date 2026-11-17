import { Temporal } from "temporal-polyfill"

import {
  APPROVAL_PRIORITY_FROM_HOURS,
  APPROVAL_SLA_HOURS,
  ApprovalPriority,
  ApprovalStatus,
  isOpenApprovalStatus,
} from "@nexora/schemas/onboarding/approvals"

const HOUR_MS = 60 * 60 * 1000 // Milliseconds in one hour

const ageInHours = (submittedAt: Temporal.Instant, now: Temporal.Instant) =>
  (now.epochMilliseconds - submittedAt.epochMilliseconds) / HOUR_MS

/**
 * Priority until requests store one: the longer an open request has waited,
 * the higher. Closed requests are LOW; nothing is waiting on them.
 */
export const derivePriority = (
  status: ApprovalStatus,
  submittedAt: Temporal.Instant,
  now: Temporal.Instant
): ApprovalPriority => {
  if (!isOpenApprovalStatus(status)) return "LOW"

  const hours = ageInHours(submittedAt, now)
  if (hours > APPROVAL_PRIORITY_FROM_HOURS.HIGH) return "HIGH"
  if (hours > APPROVAL_PRIORITY_FROM_HOURS.MEDIUM) return "MEDIUM"
  return "LOW"
}

export const isOverdue = (
  status: ApprovalStatus,
  submittedAt: Temporal.Instant,
  now: Temporal.Instant
) =>
  isOpenApprovalStatus(status) &&
  ageInHours(submittedAt, now) > APPROVAL_SLA_HOURS
