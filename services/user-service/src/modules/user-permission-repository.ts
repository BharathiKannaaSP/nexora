import { Temporal } from "temporal-polyfill"

import { KAFKA_TOPICS } from "@nexora/kafka"
import type { OrganizationMembershipCreatedPayload } from "@nexora/schemas/events/organization"
import {
  platformPermissionKey,
  type AdminAccessApprovedPayload,
  type PlatformPermission,
  type UserPlatformPermissionsChangedPayload,
} from "@nexora/schemas/events/permissions"

import type { OrganizationPermissionGrant } from "@nexora/shared/types/user"

import { db } from "../prisma/user-db"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** The user's platform (organizationId null) permissions. */
const platformPermissions = (tx: Transaction, userId: string) =>
  tx.orm.public.UserPermission.where({ userId, organizationId: null }).all()

/** The user's platform permissions, countries uppercase as stored ("IN"). */
export const getPlatformPermissionsRepository = async (
  userId: string
): Promise<PlatformPermission[]> => {
  const rows = await db.orm.public.UserPermission.where({
    userId,
    organizationId: null,
  }).all()
  return rows.map(({ countryCode, moduleCode, accessLevel }) => ({
    countryCode: countryCode.toUpperCase(),
    moduleCode,
    accessLevel,
  }))
}

/** The user's permissions in their organizations, countries uppercase. */
export const getOrganizationPermissionsRepository = async (
  userId: string
): Promise<OrganizationPermissionGrant[]> => {
  const rows = await db.orm.public.UserPermission.where({ userId })
    .where((p) => p.organizationId.isNotNull())
    .all()
  return rows.flatMap(({ organizationId, countryCode, moduleCode, accessLevel }) =>
    organizationId
      ? [{ organizationId, countryCode: countryCode.toUpperCase(), moduleCode, accessLevel }]
      : []
  )
}

/**
 * Queues user.platform-permissions.changed with ALL of the user's platform
 * permissions, in the caller's transaction, so the event goes out only if
 * the change is saved (and always does if it is).
 */
const queuePlatformPermissionsChanged = async (
  tx: Transaction,
  userId: string
) => {
  const now = Temporal.Now.instant()
  const rows = await platformPermissions(tx, userId)

  const payload: UserPlatformPermissionsChangedPayload = {
    userId,
    snapshotAt: now.toString(),
    permissions: rows.map(({ countryCode, moduleCode, accessLevel }) => ({
      countryCode,
      moduleCode,
      accessLevel,
    })),
  }

  await tx.orm.public.OutboxEvent.create({
    eventType: KAFKA_TOPICS.USER_PLATFORM_PERMISSIONS_CHANGED,
    aggregateId: userId,
    payload,
    status: "PENDING",
    attempts: 0,
    availableAt: now,
  })
}

/**
 * Grants an approved admin access request's permissions. Idempotent, since
 * Kafka can deliver an event twice: permissions the user already has are
 * skipped. Returns how many were added.
 */
export const grantAdminAccessRepository = async (
  event: AdminAccessApprovedPayload
): Promise<number> => {
  return db.transaction(async (tx) => {
    const held = new Set(
      (await platformPermissions(tx, event.userId)).map(platformPermissionKey)
    )

    let added = 0
    for (const permission of event.permissions) {
      const key = platformPermissionKey(permission)
      if (held.has(key)) continue
      held.add(key)

      await tx.orm.public.UserPermission.create({
        ...permission,
        userId: event.userId,
        organizationId: null,
        sourceRequestId: event.requestId,
        grantedByUserId: event.approvedByUserId,
      })
      added++
    }

    // Sent even when nothing was added: a replay then resyncs consumers.
    await queuePlatformPermissionsChanged(tx, event.userId)

    return added
  })
}

/**
 * Grants a new member's permissions in their organization. Idempotent, like
 * grantAdminAccessRepository: permissions already held there are skipped.
 * Organization permissions aren't platform ones, so no
 * user.platform-permissions.changed goes out. Returns how many were added.
 */
export const grantOrganizationPermissionsRepository = async (
  event: OrganizationMembershipCreatedPayload
): Promise<number> => {
  return db.transaction(async (tx) => {
    const held = new Set(
      (
        await tx.orm.public.UserPermission.where({
          userId: event.userId,
          organizationId: event.organizationId,
        }).all()
      ).map(({ moduleCode, accessLevel }) => `${moduleCode}:${accessLevel}`)
    )

    let added = 0
    for (const { moduleCode, accessLevel } of event.permissions) {
      const key = `${moduleCode}:${accessLevel}`
      if (held.has(key)) continue
      held.add(key)

      await tx.orm.public.UserPermission.create({
        userId: event.userId,
        organizationId: event.organizationId,
        countryCode: event.countryCode.toUpperCase(),
        moduleCode,
        accessLevel,
        sourceRequestId: event.sourceRequestId,
        grantedByUserId: event.approvedByUserId,
      })
      added++
    }

    return added
  })
}
