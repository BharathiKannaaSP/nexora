import { z } from "zod"

import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "../onboarding/become-admin"

/** One permission inside an organization; its country is the organization's. */
export const organizationPermissionSchema = z.object({
  moduleCode: z.enum(PERMISSION_MODULES),
  accessLevel: z.enum(PERMISSION_ACTIONS),
})
export type OrganizationPermission = z.infer<typeof organizationPermissionSchema>

const jsonObject = z.record(z.string(), z.unknown())

/** What a CREATE request proposed, as the organization is created from it. */
const proposedOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  countryCode: z.string().min(2),
  industry: z.string().min(1),
  size: z.string().min(1),
  website: z.string().nullable(),
  logoObjectKey: z.string().min(1),
  taxDetails: jsonObject,
  address: jsonObject,
})

/** From the JOIN request, kept on the membership. */
const membershipDetailsSchema = z.object({
  employeeId: z.string().nullable(),
  jobTitle: z.string().nullable(),
  department: z.string().nullable(),
  workEmail: z.string().nullable(),
  reportingManager: z.string().nullable(),
})

/**
 * onboarding.organization-request.approved, from onboarding-service: a
 * CREATE request (organization-service creates the organization, with the
 * requester as its first member) or a JOIN request (it adds the member).
 */
export const organizationRequestApprovedEventSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      eventId: z.string().min(1),
      type: z.literal("CREATE"),
      requestId: z.string().min(1),
      userId: z.string().min(1),
      approvedByUserId: z.string().min(1),
      organization: proposedOrganizationSchema,
      permissions: z.array(organizationPermissionSchema),
    }),
    z.object({
      eventId: z.string().min(1),
      type: z.literal("JOIN"),
      requestId: z.string().min(1),
      userId: z.string().min(1),
      approvedByUserId: z.string().min(1),
      organizationId: z.string().min(1),
      membership: membershipDetailsSchema,
      permissions: z.array(organizationPermissionSchema),
    }),
  ]
)

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

export type OrganizationRequestApprovedPayload = DistributiveOmit<
  z.infer<typeof organizationRequestApprovedEventSchema>,
  "eventId"
>

export const ORGANIZATION_MEMBER_ROLES = ["ORG_ADMIN", "ORG_MEMBER"] as const
export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLES)[number]

/**
 * organization.membership.created, from organization-service: user-service
 * grants `permissions` in the organization, auth-service gives the user
 * `role` (the creator is ORG_ADMIN, a joiner ORG_MEMBER).
 */
export const organizationMembershipCreatedEventSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  /** The organization's, uppercase: its permissions apply there. */
  countryCode: z.string().min(2),
  role: z.enum(ORGANIZATION_MEMBER_ROLES),
  permissions: z.array(organizationPermissionSchema),
  sourceRequestId: z.string().min(1),
  approvedByUserId: z.string().min(1),
})

export type OrganizationMembershipCreatedPayload = Omit<
  z.infer<typeof organizationMembershipCreatedEventSchema>,
  "eventId"
>
