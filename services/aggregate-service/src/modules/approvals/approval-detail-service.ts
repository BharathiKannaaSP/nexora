import type {
  ApprovalDetailQuery,
  ApprovalRequestParams,
} from "@nexora/schemas/onboarding/approvals"
import { AppError } from "@nexora/shared/express/app-error"
import type {
  ApprovalDetailResponseData,
  ApprovalRecordResponseData,
  ApprovalRequestRecord,
} from "@nexora/shared/types/approvals"
import type { OrganizationDirectoryEntry } from "@nexora/shared/types/organization"
import type { UserDetailsResponseData } from "@nexora/shared/types/user"

import {
  signFileUrls,
  signFileViewAndDownloadUrls,
} from "../../clients/media-urls"
import { fetchFromService } from "../../clients/service-client"
import {
  lookupOrganizations,
  lookupUsers,
  toPerson,
} from "./approval-enrichment"
import {
  fetchReviewedCountries,
  isVisibleInCountry,
} from "./approval-visibility"

/** The logo and documents the request carries, with a name to download as. */
const requestFiles = (request: ApprovalRequestRecord) => {
  if (request.type === "ADMIN_ACCESS") return []

  const { proposedLogoObjectKey, proposedDocuments } =
    request.organizationRequest
  return [
    ...(proposedLogoObjectKey
      ? [
          {
            key: proposedLogoObjectKey,
            fileName: proposedLogoObjectKey.split("/").pop() ?? "logo",
          },
        ]
      : []),
    ...proposedDocuments.map(({ objectKey, originalFileName }) => ({
      key: objectKey,
      fileName: originalFileName,
    })),
  ]
}

/** The applicant's profile; null if it can't be loaded (it's extra). */
const fetchApplicant = (callerId: string, userId: string) =>
  fetchFromService<UserDetailsResponseData>(
    "user",
    `/internal/v1/users/${encodeURIComponent(userId)}/details`,
    callerId
  ).catch((error: unknown) => {
    console.error("Aggregate service: applicant lookup failed", error)
    return null
  })

// The caller may review it, just not under this country's pages.
const approvalOtherCountry = () =>
  new AppError(
    "This request isn't reviewed under this country",
    403,
    "APPROVAL_COUNTRY_FORBIDDEN"
  )

/**
 * One request for its reviewer, under /`country`. Two checks:
 * onboarding-service decides who may see it (its reviewer, or whoever
 * decided it; 404 otherwise), and isVisibleInCountry whether it belongs
 * under `country`, as on the list (403 otherwise: it exists and is theirs,
 * just not here). The rest is filled in here; lookups that fail leave
 * nulls rather than failing the page.
 */
export const getApprovalDetail = async (
  userId: string,
  { type, id }: ApprovalRequestParams,
  { country }: ApprovalDetailQuery
): Promise<ApprovalDetailResponseData> => {
  const [{ item, request }, reviewed] = await Promise.all([
    fetchFromService<ApprovalRecordResponseData>(
      "onboarding",
      `/api/v1/onboarding/approvals/${type}/${encodeURIComponent(id)}`,
      userId
    ),
    fetchReviewedCountries(userId),
  ])

  // A JOIN request's country is its organization's.
  const organizations = item.organizationId
    ? await lookupOrganizations(userId, [item.organizationId])
    : new Map<string, OrganizationDirectoryEntry>()
  const organization = item.organizationId
    ? (organizations.get(item.organizationId) ?? null)
    : null
  const countryCodes = item.countryCodes.length
    ? item.countryCodes
    : organization
      ? [organization.countryCode.toUpperCase()]
      : []

  if (
    !isVisibleInCountry({ type: item.type, countryCodes }, country, reviewed)
  ) {
    throw approvalOtherCountry()
  }

  const people = [
    item.submittedByUserId,
    item.assignedToUserId,
    ...(item.reviewedByUserId ? [item.reviewedByUserId] : []),
  ]

  const [users, applicant, fileUrls] = await Promise.all([
    lookupUsers(userId, [...new Set(people)]),
    fetchApplicant(userId, item.submittedByUserId),
    signFileViewAndDownloadUrls(userId, requestFiles(request)),
  ])
  const avatarUrls = await signFileUrls(
    userId,
    [...users.values()].map(({ profileImageKey }) => profileImageKey)
  )

  return {
    approval: {
      id: item.id,
      type: item.type,
      status: item.status,
      priority: item.priority,
      overdue: item.overdue,
      subject: item.subject ?? organization?.name ?? null,
      submittedBy: toPerson(item.submittedByUserId, users, avatarUrls),
      assignedTo: toPerson(item.assignedToUserId, users, avatarUrls),
      submittedAt: item.submittedAt,
      assignedAt: item.assignedAt,
      countryCodes,
      reviewedBy: item.reviewedByUserId
        ? toPerson(item.reviewedByUserId, users, avatarUrls)
        : null,
      reviewedAt: item.reviewedAt,
      reviewComment: item.reviewComment,
      applicant,
      request,
      organization,
      fileUrls: Object.fromEntries(fileUrls),
    },
  }
}
