export const KAFKA_TOPICS = {
  EMAIL_VERIFICATION_REQUESTED: "email.verification.requested",
  INITIATE_USER_ONBOARDING: "initiate.user.onboarding",
  // onboarding-service → user-service: grant the request's permissions.
  ADMIN_ACCESS_APPROVED: "onboarding.admin-access.approved",
  // user-service → onboarding-service: a user's platform permissions, whole.
  USER_PLATFORM_PERMISSIONS_CHANGED: "user.platform-permissions.changed",
} as const
