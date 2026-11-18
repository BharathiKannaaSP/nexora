import { Temporal } from "temporal-polyfill"

import { KAFKA_TOPICS } from "@nexora/kafka"
import type {
  OrganizationMembershipCreatedPayload,
  OrganizationRequestApprovedPayload,
} from "@nexora/schemas/events/organization"

import { db } from "../prisma/organization-db"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type CreatePayload = Extract<OrganizationRequestApprovedPayload, { type: "CREATE" }>
type JoinPayload = Extract<OrganizationRequestApprovedPayload, { type: "JOIN" }>

/**
 * Queues organization.membership.created in the caller's transaction, so
 * user-service grants the permissions and auth-service the role only if
 * the membership is saved.
 */
const queueMembershipCreated = (
  tx: Transaction,
  payload: OrganizationMembershipCreatedPayload
) =>
  tx.orm.public.OutboxEvent.create({
    eventType: KAFKA_TOPICS.ORGANIZATION_MEMBERSHIP_CREATED,
    aggregateId: payload.organizationId,
    payload,
    status: "PENDING",
    attempts: 0,
    availableAt: Temporal.Now.instant(),
  })

/**
 * The proposed slug, or, when another organization took it since the
 * request was made, the slug with the end of the request id: still
 * readable, and unique since request ids are.
 */
const freeSlug = async (tx: Transaction, slug: string, requestId: string) => {
  const taken = await tx.orm.public.Organization.where({ slug }).first()
  return taken ? `${slug}-${requestId.slice(-6).toLowerCase()}` : slug
}

/**
 * Creates the organization of an approved CREATE request, with the
 * requester as its first member (ORG_ADMIN). Idempotent: Kafka can deliver
 * the event twice, and Organization.sourceRequestId is unique. Returns the
 * organization's id and whether it was created now.
 */
export const createOrganizationFromRequestRepository = async (
  event: CreatePayload
) =>
  db.transaction(async (tx) => {
    const existing = await tx.orm.public.Organization.where({
      sourceRequestId: event.requestId,
    }).first()
    if (existing) return { organizationId: existing.id, created: false }

    const { organization } = event
    const created = await tx.orm.public.Organization.create({
      name: organization.name,
      slug: await freeSlug(tx, organization.slug, event.requestId),
      description: organization.description,
      countryCode: organization.countryCode.toUpperCase(),
      industry: organization.industry,
      size: organization.size,
      website: organization.website,
      logoObjectKey: organization.logoObjectKey,
      taxDetails: organization.taxDetails as never,
      address: organization.address as never,
      status: "ACTIVE",
      createdByUserId: event.userId,
      sourceRequestId: event.requestId,
    })

    await tx.orm.public.OrganizationMembership.create({
      organizationId: created.id,
      userId: event.userId,
      status: "ACTIVE",
      sourceRequestId: event.requestId,
      approvedByUserId: event.approvedByUserId,
    })

    await queueMembershipCreated(tx, {
      userId: event.userId,
      organizationId: created.id,
      countryCode: created.countryCode,
      role: "ORG_ADMIN",
      permissions: event.permissions,
      sourceRequestId: event.requestId,
      approvedByUserId: event.approvedByUserId,
    })

    return { organizationId: created.id, created: true }
  })

/**
 * Adds the member of an approved JOIN request (ORG_MEMBER). Idempotent
 * like the above, through OrganizationMembership.sourceRequestId. Someone
 * who left or was removed comes back with the new request's details.
 * Returns what happened; an organization that's gone or not ACTIVE isn't
 * joined.
 */
export const addMemberFromRequestRepository = async (
  event: JoinPayload
): Promise<"added" | "already-added" | "organization-unavailable"> =>
  db.transaction(async (tx) => {
    const organization = await tx.orm.public.Organization.where({
      id: event.organizationId,
      status: "ACTIVE",
    }).first()
    if (!organization) return "organization-unavailable"

    const existing = await tx.orm.public.OrganizationMembership.where({
      organizationId: organization.id,
      userId: event.userId,
    }).first()

    if (existing?.sourceRequestId === event.requestId) return "already-added"

    const details = {
      ...event.membership,
      status: "ACTIVE" as const,
      sourceRequestId: event.requestId,
      approvedByUserId: event.approvedByUserId,
      joinedAt: Temporal.Now.instant(),
      leftAt: null,
    }

    if (existing) {
      await tx.orm.public.OrganizationMembership.where({
        id: existing.id,
      }).update(details)
    } else {
      await tx.orm.public.OrganizationMembership.create({
        ...details,
        organizationId: organization.id,
        userId: event.userId,
      })
    }

    await queueMembershipCreated(tx, {
      userId: event.userId,
      organizationId: organization.id,
      countryCode: organization.countryCode.toUpperCase(),
      role: "ORG_MEMBER",
      permissions: event.permissions,
      sourceRequestId: event.requestId,
      approvedByUserId: event.approvedByUserId,
    })

    return "added"
  })
