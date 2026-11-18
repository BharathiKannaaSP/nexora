import { USER_LOOKUP_MAX_IDS } from "@nexora/schemas/auth/user-lookup"
import type {
  ApprovalListItem,
  ApprovalPerson,
  ApprovalQueueItem,
} from "@nexora/shared/types/approvals"
import type {
  UserLookupResponseData,
  UserSummary,
} from "@nexora/shared/types/auth"
import type {
  OrganizationDirectoryEntry,
  OrganizationDirectoryEntryResponseData,
} from "@nexora/shared/types/organization"

import { signFileUrls } from "../../clients/media-urls"
import { fetchFromService } from "../../clients/service-client"

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size)
  )

/** Names by user id; a failed lookup leaves those ids out. */
export const lookupUsers = async (callerId: string, ids: string[]) => {
  const results = await Promise.allSettled(
    chunk(ids, USER_LOOKUP_MAX_IDS).map((batch) =>
      fetchFromService<UserLookupResponseData>(
        "auth",
        "/internal/v1/users/lookup",
        callerId,
        { method: "POST", body: { ids: batch } }
      )
    )
  )

  const users = new Map<string, UserSummary>()
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Aggregate service: user lookup failed", result.reason)
      continue
    }
    for (const user of result.value.users) users.set(user.id, user)
  }
  return users
}

/** Directory entries by id; one that fails or is gone is left out. */
export const lookupOrganizations = async (callerId: string, ids: string[]) => {
  const results = await Promise.allSettled(
    ids.map((id) =>
      fetchFromService<OrganizationDirectoryEntryResponseData>(
        "organization",
        `/api/v1/organization/directory/${encodeURIComponent(id)}`,
        callerId
      )
    )
  )

  const organizations = new Map<string, OrganizationDirectoryEntry>()
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      organizations.set(ids[index]!, result.value.organization)
    } else {
      console.error(
        "Aggregate service: organization lookup failed",
        result.reason
      )
    }
  })
  return organizations
}

/**
 * Fills in what onboarding doesn't know about JOIN_ORG requests, from the
 * organization: its country (so the queue can be narrowed to one) and its
 * name as the subject. One lookup per organization, for the whole queue.
 * A JOIN request whose organization can't be looked up keeps no country,
 * so it's left out of every country rather than shown in the wrong one.
 */
export const resolveRequestCountries = async (
  callerId: string,
  items: ApprovalQueueItem[]
): Promise<ApprovalQueueItem[]> => {
  const organizationIds = [
    ...new Set(
      items.flatMap((i) => (i.organizationId ? [i.organizationId] : []))
    ),
  ]
  if (organizationIds.length === 0) return items

  const organizations = await lookupOrganizations(callerId, organizationIds)

  return items.map((item) => {
    const organization = item.organizationId
      ? organizations.get(item.organizationId)
      : undefined
    if (!organization) return item
    return {
      ...item,
      subject: item.subject ?? organization.name,
      countryCodes: item.countryCodes.length
        ? item.countryCodes
        : [organization.countryCode.toUpperCase()],
    }
  })
}

export const toPerson = (
  userId: string,
  users: Map<string, UserSummary>,
  avatarUrls: Map<string, string>
): ApprovalPerson => {
  const user = users.get(userId)
  const avatarKey = user?.profileImageKey
  return {
    userId,
    name: user ? `${user.firstName} ${user.lastName}`.trim() : null,
    email: user?.email ?? null,
    // Null without an image (or if signing failed); the UI shows initials.
    avatarUrl: (avatarKey && avatarUrls.get(avatarKey)) ?? null,
  }
}

/**
 * Queue items (already through resolveRequestCountries) with names, emails
 * and avatars filled in. Lookups that fail leave nulls rather than failing
 * the page.
 */
export const enrichApprovals = async (
  callerId: string,
  items: ApprovalQueueItem[]
): Promise<ApprovalListItem[]> => {
  if (items.length === 0) return []

  const userIds = [
    ...new Set(items.flatMap((i) => [i.submittedByUserId, i.assignedToUserId])),
  ]
  const users = await lookupUsers(callerId, userIds)
  const avatarUrls = await signFileUrls(
    callerId,
    [...users.values()].map(({ profileImageKey }) => profileImageKey)
  )

  return items.map((item) => ({
    id: item.id,
    type: item.type,
    status: item.status,
    priority: item.priority,
    overdue: item.overdue,
    subject: item.subject,
    submittedBy: toPerson(item.submittedByUserId, users, avatarUrls),
    assignedTo: toPerson(item.assignedToUserId, users, avatarUrls),
    submittedAt: item.submittedAt,
  }))
}
