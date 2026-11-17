// `data` of auth-service responses, as they arrive over JSON: timestamps are
// ISO 8601 strings.

export type SystemRole = "ADMIN" | "USER" | "GUEST" | "ORG_ADMIN" | "ORG_MEMBER"

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

/** Returned by register and sign-in. */
export interface AuthUser {
  id: string
  email: string
  userName: string
  firstName: string
  lastName: string
  /** Private S3 key of the avatar; sign it to show it. */
  profileImageKey: string | null
  systemRole: SystemRole
  accountStatus: AccountStatus
  isEmailVerified: boolean
  createdAt: string
}

/** Returned by /auth/me. */
export interface CurrentUser extends AuthUser {
  emailVerifiedAt: string | null
  preferredLocale: string
  countryCode: string
  updatedAt: string
}

/** POST /auth/register */
export interface RegisterResponseData {
  user: AuthUser
}

/** POST /auth/verify-email */
export interface VerifyEmailResponseData {
  result: { emailVerified: boolean }
}

/** POST /auth/resend-verification */
export type ResendVerificationResponseData = null

/** POST /auth/sign-in. The refresh token comes as a cookie, not in the body. */
export interface SignInResponseData {
  accessToken: string
  tokenType: "Bearer"
  expiresIn: number
  /** With the saved /country/lang, where the app opens after sign-in. */
  user: AuthUser & Pick<CurrentUser, "preferredLocale" | "countryCode">
}

/** POST /auth/refresh. The rotated refresh token comes as a cookie. */
export interface RefreshResponseData {
  accessToken: string
  tokenType: "Bearer"
  expiresIn: number
}

/** GET /auth/me */
export interface MeResponseData {
  user: CurrentUser
}

/** POST /auth/logout */
export type LogoutResponseData = null

/** What other services may know about a user. */
export interface UserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImageKey: string | null
}

/** POST /internal/v1/users/lookup. Unknown ids are left out. */
export interface UserLookupResponseData {
  users: UserSummary[]
}
