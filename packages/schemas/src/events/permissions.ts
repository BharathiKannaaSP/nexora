import { z } from "zod"
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
} from "../onboarding/become-admin"

/** One platform (non-organization) permission. */
export const platformPermissionSchema = z.object({
  countryCode: z.string().min(1),
  moduleCode: z.enum(PERMISSION_MODULES),
  accessLevel: z.enum(PERMISSION_ACTIONS),
})

export type PlatformPermission = z.infer<typeof platformPermissionSchema>

/**
 * onboarding.admin-access.approved, from onboarding-service: an admin access
 * request was approved; user-service grants its permissions.
 */
export const adminAccessApprovedEventSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  requestId: z.string().min(1),
  /** Null when the system approved it (the first admin). */
  approvedByUserId: z.string().min(1).nullable(),
  permissions: z.array(platformPermissionSchema),
})

export type AdminAccessApprovedPayload = Omit<
  z.infer<typeof adminAccessApprovedEventSchema>,
  "eventId"
>

/**
 * user.platform-permissions.changed, from user-service: ALL of a user's
 * platform permissions after a change, not a diff, so replaying or
 * reordering events can't leave stale rows. `snapshotAt` orders them: a
 * consumer ignores a snapshot older than the one it already has.
 */
export const userPlatformPermissionsChangedEventSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  /** ISO instant the snapshot was read at. */
  snapshotAt: z.string().min(1),
  permissions: z.array(platformPermissionSchema),
})

export type UserPlatformPermissionsChangedPayload = Omit<
  z.infer<typeof userPlatformPermissionsChangedEventSchema>,
  "eventId"
>
