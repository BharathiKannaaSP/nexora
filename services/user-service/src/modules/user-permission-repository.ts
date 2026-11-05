import { Temporal } from "temporal-polyfill"

import { KAFKA_TOPICS } from "@nexora/kafka"
import {
  platformPermissionKey,
  type AdminAccessApprovedPayload,
  type UserPlatformPermissionsChangedPayload,
} from "@nexora/schemas/events/permissions"

import { db } from "../prisma/user-db"

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** The user's platform (organizationId null) permissions. */
const platformPermissions = (tx: Transaction, userId: string) =>
  tx.orm.public.UserPermission.where({ userId, organizationId: null }).all()

/**
 * The countries the user holds any platform permission in, lowercase like
 * the /[country] URLs (permissions store them as "IN").
 */
export const getPlatformCountriesRepository = async (
  userId: string
): Promise<string[]> => {
  const rows = await db.orm.public.UserPermission.where({
    userId,
    organizationId: null,
  }).all()
  return [...new Set(rows.map(({ countryCode }) => countryCode.toLowerCase()))]
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
