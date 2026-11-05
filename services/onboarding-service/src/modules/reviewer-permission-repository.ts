import type { UserPlatformPermissionsChangedPayload } from "@nexora/schemas/events/permissions"
import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/onboarding-db"

/**
 * Replaces a user's ReviewerPermission rows with a snapshot from
 * user-service. A snapshot older than (or as old as) the last one applied
 * is ignored, so late or repeated events can't bring back old permissions.
 * Returns whether it was applied.
 */
export const applyPlatformPermissionsSnapshotRepository = async (
  snapshot: UserPlatformPermissionsChangedPayload
): Promise<boolean> => {
  const snapshotAt = Temporal.Instant.from(snapshot.snapshotAt)

  return db.transaction(async (tx) => {
    const sync = await tx.orm.public.ReviewerPermissionSync.where({
      userId: snapshot.userId,
    }).first()

    if (sync && Temporal.Instant.compare(snapshotAt, sync.snapshotAt) <= 0) {
      return false
    }

    if (sync) {
      await tx.orm.public.ReviewerPermissionSync.where({
        userId: snapshot.userId,
      }).update({ snapshotAt })
    } else {
      await tx.orm.public.ReviewerPermissionSync.create({
        userId: snapshot.userId,
        snapshotAt,
      })
    }

    await tx.orm.public.ReviewerPermission.where({
      userId: snapshot.userId,
    }).deleteAndCount()

    // A snapshot can list a permission twice; the table can't hold it twice.
    const unique = new Map(
      snapshot.permissions.map((p) => [
        `${p.countryCode}:${p.moduleCode}:${p.accessLevel}`,
        p,
      ])
    )
    for (const permission of unique.values()) {
      await tx.orm.public.ReviewerPermission.create({
        ...permission,
        userId: snapshot.userId,
      })
    }

    return true
  })
}
