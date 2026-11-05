import type {
  PermissionAction,
  PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import { KAFKA_TOPICS } from "@nexora/kafka"
import type {
  AdminAccessApprovedPayload,
  PlatformPermission,
} from "@nexora/schemas/events/permissions"
import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/onboarding-db"

/** RequestAssignment.requestType values. */
export type AssignableRequestType = "ADMIN_ACCESS" | "CREATE_ORG" | "JOIN_ORG"

/** The admin module whose holders review each kind of request. */
const REVIEWER_MODULE = {
  ADMIN_ACCESS: "USER_MANAGEMENT",
  CREATE_ORG: "ORGANIZATION_MANAGEMENT",
  JOIN_ORG: "ORGANIZATION_MANAGEMENT",
} as const satisfies Record<AssignableRequestType, PermissionModuleCode>

/**
 * Approving or rejecting a request changes it, so a reviewer needs EDIT on
 * the module; VIEW alone isn't enough.
 */
const REVIEWER_ACCESS_LEVEL: PermissionAction = "EDIT"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * The users who can review `requestType`: they hold REVIEWER_ACCESS_LEVEL
 * on its module in EVERY one of `countryCodes`, so one reviewer can decide
 * the whole request (an admin for India can't approve access to Germany).
 * Empty `countryCodes` means the country isn't known: any country will do.
 *
 * Read from ReviewerPermission, the local copy of user-service's platform
 * permissions, so no other service is called mid-submit. Sorted, so the
 * round robin goes through them in a stable order.
 */
const eligibleReviewers = async (
  tx: Transaction,
  requestType: AssignableRequestType,
  countryCodes: string[],
  excludeUserId: string
) => {
  const countries = [...new Set(countryCodes.map((c) => c.toUpperCase()))]

  const permissions = await tx.orm.public.ReviewerPermission.where({
    moduleCode: REVIEWER_MODULE[requestType],
    accessLevel: REVIEWER_ACCESS_LEVEL,
  }).all()

  const countriesByUser = new Map<string, Set<string>>()
  for (const { userId, countryCode } of permissions) {
    const held = countriesByUser.get(userId) ?? new Set<string>()
    held.add(countryCode.toUpperCase())
    countriesByUser.set(userId, held)
  }

  return (
    [...countriesByUser]
      .filter(([, held]) => countries.every((country) => held.has(country)))
      .map(([userId]) => userId)
      // No one reviews their own request.
      .filter((userId) => userId !== excludeUserId)
      .sort()
  )
}

/**
 * Assigns a submitted request to a reviewer, round robin among those who
 * cover all its countries: the eligible reviewer after the one who got the
 * last request of this type, wrapping around. Runs in the submit's
 * transaction, so the request and its assignment are saved together.
 *
 * A resubmitted request keeps its reviewer while they can still review it
 * (e.g. it now asks for a country they don't manage: it moves on). With no
 * eligible reviewer the request is left unassigned (returns null).
 */
export const assignReviewer = async (
  tx: Transaction,
  {
    requestId,
    requestType,
    countryCodes,
    requesterUserId,
  }: {
    requestId: string
    requestType: AssignableRequestType
    /** The countries the request is for; [] when not known. */
    countryCodes: string[]
    requesterUserId: string
  }
) => {
  // One assignment of a type at a time, until this transaction ends: two
  // submits at once would otherwise both pick the same "next" reviewer.
  await tx.execute(
    tx.raw
      .sql`SELECT pg_advisory_xact_lock(hashtext(${`request-assignment:${requestType}`}::text))`
      .affectedCount()
      .build()
  )

  const reviewers = await eligibleReviewers(
    tx,
    requestType,
    countryCodes,
    requesterUserId
  )

  if (reviewers.length === 0) {
    console.warn(
      `No reviewer covers ${countryCodes.join(", ") || "any country"} for ${requestType} request ${requestId}; left unassigned`
    )
    return null
  }

  const current = await tx.orm.public.RequestAssignment.where({
    requestId,
    requestType,
  })
    .orderBy((a) => a.assignedAt.desc())
    .first()

  if (current && reviewers.includes(current.assignedToUserId)) return current

  // The last request of this type that went to someone still eligible.
  const last = await tx.orm.public.RequestAssignment.where({ requestType })
    .where((a) => a.assignedToUserId.in(reviewers))
    .orderBy([(a) => a.assignedAt.desc(), (a) => a.id.desc()])
    .first()

  const next = last
    ? reviewers[
        (reviewers.indexOf(last.assignedToUserId) + 1) % reviewers.length
      ]!
    : reviewers[0]!

  return tx.orm.public.RequestAssignment.create({
    requestId,
    requestType,
    assignedToUserId: next,
    // Null: assigned by the system, not by a person.
    assignedByUserId: requesterUserId ?? null,
    reason: current ? "ROUND_ROBIN_REASSIGNED" : "ROUND_ROBIN",
  })
}

/**
 * Bootstraps the first admin: with no one able to review admin requests,
 * one would wait forever. Approves `request` only if NO admin access request
 * has ever been approved, so it happens once. It checks onboarding's own
 * requests, not the ReviewerPermission copy, which is empty on a fresh
 * deploy or while the sync lags and would let anyone in.
 *
 * Call it in the submit's transaction after assignReviewer, which holds the
 * ADMIN_ACCESS lock: two first submits at once can't both be approved.
 *
 * Marks the request APPROVED and the onboarding COMPLETED, and queues
 * onboarding.admin-access.approved for user-service to grant the
 * permissions. Returns the updated rows, or null when it didn't approve.
 */
export const approveFirstAdminRequest = async (
  tx: Transaction,
  {
    onboardingId,
    request,
    permissions,
  }: {
    onboardingId: string
    request: { id: string; userId: string }
    permissions: PlatformPermission[]
  }
) => {
  const anyApproved = await tx.orm.public.AdminAccessRequest.where({
    status: "APPROVED",
  }).first()

  if (anyApproved) {
    console.warn(
      `No reviewer for admin access request ${request.id}; left unassigned`
    )
    return null
  }

  const now = Temporal.Now.instant()

  const approved = await tx.orm.public.AdminAccessRequest.where({
    id: request.id,
  }).update({
    status: "APPROVED",
    reviewedAt: now,
    // reviewedByUserId stays null: no person approved it.
    reviewComment: "Approved automatically as the first admin",
  })

  const completed = await tx.orm.public.Onboarding.where({
    id: onboardingId,
  }).update({ status: "COMPLETED", currentStep: "COMPLETED", completedAt: now })

  if (!approved || !completed) {
    throw new Error("First admin request disappeared mid-transaction")
  }

  const payload: AdminAccessApprovedPayload = {
    userId: request.userId,
    requestId: request.id,
    approvedByUserId: null,
    permissions: permissions.map(
      ({ countryCode, moduleCode, accessLevel }) => ({
        countryCode,
        moduleCode,
        accessLevel,
      })
    ),
  }

  await tx.orm.public.OutboxEvent.create({
    eventType: KAFKA_TOPICS.ADMIN_ACCESS_APPROVED,
    aggregateId: request.userId,
    payload,
    status: "PENDING",
    attempts: 0,
    availableAt: now,
  })

  console.info(
    `Admin access request ${request.id} approved automatically: first admin`
  )

  return { request: approved, onboarding: completed }
}
