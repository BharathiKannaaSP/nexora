import type {
  SignUpFormValues,
  SignUpLocale,
} from "@nexora/schemas/auth/sign-up"
import { AppError } from "@nexora/shared/express/app-error"
import { toSupportedCountryLocale } from "@nexora/shared/constants/i18n"
import { authRepository } from "./auth-repository"
import bcrypt from "bcryptjs"
import {
  generateVerificationToken,
  hashVerificationToken,
} from "../lib/helpers/verification-token"
import { encryptToken } from "../lib/helpers/token-encryption"
import { Temporal } from "temporal-polyfill"
import {
  ACCESS_TOKEN_TTL_SECONDS,
  PASSWORD_HASH_ROUNDS,
  REFRESH_REUSE_GRACE_MS,
  REFRESH_TOKEN_TTL_MS,
  SIGN_IN_ATTEMPT_LIMIT,
  SIGN_IN_ATTEMPT_WINDOW_MS,
  VERIFICATION_RESEND_COOLDOWN_MS,
  VERIFICATION_TOKEN_TTL_HOURS,
} from "@nexora/shared/constants/auth"
import { signInAccessToken } from "../lib/helpers/access-token"
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../lib/helpers/refresh-token"
import { createAttemptLimiter } from "../lib/attempt-limiter"
import { UpdateMeFormValues } from "@nexora/schemas/auth/update-me"

// Compared against when no user matches, so an unknown email or username
// takes as long to reject as a wrong password and timing can't reveal which
// accounts exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "nexora-unknown-account",
  PASSWORD_HASH_ROUNDS
)

const signInLimiter = createAttemptLimiter({
  limit: SIGN_IN_ATTEMPT_LIMIT,
  windowMs: SIGN_IN_ATTEMPT_WINDOW_MS,
})

export const authService = {
  async register(input: SignUpFormValues, localeInfo: SignUpLocale) {
    const email = input.email.toLowerCase().trim()
    // Stored lowercase so sign-in can match usernames case-insensitively
    const userName = input.userName.toLowerCase().trim()

    if (Buffer.byteLength(input.password, "utf-8") > 72) {
      throw new AppError(
        "Password cannot exceed 72 bytes",
        400,
        "PASSWORD_TOO_LONG"
      )
    }

    const existingUser = await authRepository.findByEmail(email)
    const existingUserName = await authRepository.findByUserName(userName)

    if (existingUserName) {
      throw new AppError(
        "An account with this username already exists",
        400,
        "USERNAME_ALREADY_EXISTS"
      )
    }

    if (existingUser) {
      throw new AppError(
        "An account with this email already exists",
        400,
        "EMAIL_ALREADY_EXISTS"
      )
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS)
    // The verification email links to /country/locale, so the pair must be
    // one the admin app serves.
    const { country, locale } = toSupportedCountryLocale(
      localeInfo.country,
      localeInfo.locale
    )
    const { token, tokenHash } = generateVerificationToken()
    try {
      const user = await authRepository.createUser({
        email,
        passwordHash,
        userName,
        firstName: input.firstName,
        lastName: input.lastName,
        preferredLocale: locale,
        countryCode: country,
        tokenHash,
        encryptedVerificationToken: encryptToken(token, email),
        tokenExpiresAt: Temporal.Now.instant().add({
          hours: VERIFICATION_TOKEN_TTL_HOURS,
        }),
      })

      return {
        id: user.id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      }
    } catch (error) {
      // Handle a duplicate email inserted concurrently by another request
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code == "P2002"
      ) {
        throw new AppError(
          "An account with this email already exists",
          400,
          "EMAIL_ALREADY_EXISTS"
        )
      }
      throw error
    }
  },

  async verifyEmail(token: string) {
    if (!token || token.length > 200) {
      throw new AppError(
        "Invalid verification token",
        400,
        "INVALID_VERIFICATION_TOKEN"
      )
    }

    const tokenHash = hashVerificationToken(token)

    const verified = await authRepository.verifyEmail(
      tokenHash,
      Temporal.Now.instant()
    )

    if (!verified) {
      throw new AppError(
        "Invalid or expired verification token",
        400,
        "INVALID_VERIFICATION_TOKEN"
      )
    }

    return { emailVerified: true }
  },

  /**
   * Silently does nothing for unknown, verified, or inactive accounts, and
   * within the cooldown, so callers can't tell which case applied.
   */
  async resendVerification(identifier: string) {
    const user = await authRepository.findByIdentifier(
      identifier.toLowerCase().trim()
    )

    if (!user || user.isEmailVerified || user.accountStatus !== "ACTIVE") {
      return
    }

    const now = Temporal.Now.instant()
    const latestToken = await authRepository.findLatestVerificationToken(
      user.id
    )

    if (
      latestToken &&
      Temporal.Instant.compare(
        latestToken.createdAt.add({
          milliseconds: VERIFICATION_RESEND_COOLDOWN_MS,
        }),
        now
      ) > 0
    ) {
      return
    }

    const { token, tokenHash } = generateVerificationToken()

    await authRepository.replaceVerificationToken({
      userId: user.id,
      email: user.email,
      preferredLocale: user.preferredLocale,
      countryCode: user.countryCode,
      tokenHash,
      encryptedVerificationToken: encryptToken(token, user.email),
      tokenExpiresAt: now.add({ hours: VERIFICATION_TOKEN_TTL_HOURS }),
      now,
    })
  },

  async login(input: { identifier: string; password: string }) {
    // Emails and usernames are both stored lowercase
    const identifier = input.identifier.toLowerCase().trim()
    const user = await authRepository.findByIdentifier(identifier)

    // Keyed by user so switching between email and username doesn't reset
    // the count. Unknown identifiers are limited the same way, so a 429
    // doesn't reveal whether the account exists.
    const limiterKey = user ? `user:${user.id}` : `identifier:${identifier}`

    if (signInLimiter.isBlocked(limiterKey)) {
      throw new AppError(
        "Too many sign-in attempts, please try again later",
        429,
        "TOO_MANY_REQUESTS"
      )
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH
    )

    if (!user || !isPasswordValid) {
      signInLimiter.recordFailure(limiterKey)
      throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS")
    }

    signInLimiter.reset(limiterKey)

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE")
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        "Email not verified. Please verify your email before signing in",
        403,
        "EMAIL_NOT_VERIFIED"
      )
    }

    const accessToken = await signInAccessToken(user.id)
    const refreshToken = await generateRefreshToken()
    const tokenHash = hashRefreshToken(refreshToken)

    const expiresAt = Temporal.Instant.fromEpochMilliseconds(
      Date.now() + REFRESH_TOKEN_TTL_MS
    )

    await authRepository.createRefreshSession({
      userId: user.id,
      tokenHash,
      expiresAt,
    })

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer" as const,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        systemRole: user.systemRole,
        accountStatus: user.accountStatus,
        isEmailVerified: user.isEmailVerified,
        // So the client can open the app in the user's saved /country/lang.
        preferredLocale: user.preferredLocale,
        countryCode: user.countryCode,
        createdAt: user.createdAt,
      },
    }
  },
  async signIn(input: { identifier: string; password: string }) {
    return this.login(input)
  },

  async getCurrentUser(userId: string) {
    const user = await authRepository.findById(userId)

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND")
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE")
    }

    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      systemRole: user.systemRole,
      accountStatus: user.accountStatus,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      preferredLocale: user.preferredLocale,
      countryCode: user.countryCode,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },

  async refresh(rawToken: string) {
    if (!rawToken || rawToken.length > 200) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN")
    }

    const tokenHash = hashRefreshToken(rawToken)

    const now = Temporal.Now.instant()

    const session = await authRepository.findRefreshSessionByHash(tokenHash)

    if (!session) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN")
    }

    if (session.revokedAt) {
      const withinGrace =
        Temporal.Instant.compare(
          session.revokedAt.add({ milliseconds: REFRESH_REUSE_GRACE_MS }),
          now
        ) > 0

      if (withinGrace) {
        throw new AppError(
          "Refresh token was just rotated",
          401,
          "REFRESH_TOKEN_ROTATED"
        )
      }

      // A stolen token is replayed after the owner already rotated it, so end
      // every session for the user and make both parties sign in again.
      await authRepository.revokeAllRefreshSessions(session.userId, now)

      throw new AppError(
        "Refresh token has already been used",
        401,
        "REFRESH_TOKEN_REUSED"
      )
    }

    // Check if the refresh token has expired.
    if (Temporal.Instant.compare(session.expiresAt, now) <= 0) {
      throw new AppError(
        "Refresh token has expired",
        401,
        "REFRESH_TOKEN_EXPIRED"
      )
    }

    const user = await authRepository.findById(session.userId)

    if (!user || user.accountStatus !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE")
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        "Email verification is required",
        403,
        "EMAIL_NOT_VERIFIED"
      )
    }

    const newRefreshToken = generateRefreshToken()
    const newTokenHash = hashRefreshToken(newRefreshToken)
    const expiresAt = now.add({ milliseconds: REFRESH_TOKEN_TTL_MS })
    const rotation = await authRepository.rotateRefreshSession({
      sessionId: session.id,
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
      now,
    })

    // Another request rotated this session between the read above and now.
    if (!rotation) {
      throw new AppError(
        "Refresh token was just rotated",
        401,
        "REFRESH_TOKEN_ROTATED"
      )
    }

    return {
      accessToken: await signInAccessToken(user.id),
      refreshToken: newRefreshToken,
    }
  },

  async logout(rawToken?: string) {
    if (!rawToken || rawToken.length > 200) {
      return
    }

    const tokenHash = hashRefreshToken(rawToken)
    const session = await authRepository.findRefreshSessionByHash(tokenHash)

    if (!session || session.revokedAt) {
      return
    }

    await authRepository.revokeRefreshSession(
      session.id,
      Temporal.Now.instant()
    )
  },

  async updateMe(input: UpdateMeFormValues, userId: string) {
    const user = await authRepository.findById(userId)

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND")
    }

    if (user.accountStatus !== "ACTIVE") {
      throw new AppError("Account is not active", 403, "ACCOUNT_NOT_ACTIVE")
    }

    if (Object.values(input).every((value) => value === undefined)) {
      throw new AppError("No fields to update", 400, "NOTHING_TO_UPDATE")
    }

    const email = input.email?.toLowerCase().trim()
    const userName = input.userName?.toLowerCase().trim()
    const emailChanged = email !== undefined && email !== user.email
    if (userName !== undefined && userName !== user.userName) {
      const existingUserName = await authRepository.findByUserName(userName)

      if (existingUserName) {
        throw new AppError(
          "An account with this username already exists",
          400,
          "USERNAME_ALREADY_EXISTS"
        )
      }
    }

    if (emailChanged) {
      const existingUser = await authRepository.findByEmail(email)
      if (existingUser) {
        throw new AppError(
          "An account with this email already exists",
          400,
          "EMAIL_ALREADY_EXISTS"
        )
      }
    }

    // Normalized together, so changing one can't leave the saved pair
    // unsupported, e.g. country "jp" with locale "ta".
    const localeChanged =
      input.preferredLocale !== undefined || input.countryCode !== undefined
    const { country, locale } = toSupportedCountryLocale(
      input.countryCode ?? user.countryCode,
      input.preferredLocale ?? user.preferredLocale
    )

    const now = Temporal.Now.instant()
    // Same token resendVerification() sends, but without its cooldown: a link
    // still pointing at the old address must stop working right away.
    let verification
    if (emailChanged) {
      const { token, tokenHash } = generateVerificationToken()
      verification = {
        email,
        preferredLocale: locale,
        countryCode: country,
        tokenHash,
        encryptedVerificationToken: encryptToken(token, email),
        tokenExpiresAt: now.add({ hours: VERIFICATION_TOKEN_TTL_HOURS }),
        now,
      }
    }

    // Hashed like register(); the plain password never reaches the repository.
    const { password, ...fields } = input
    const passwordHash =
      password === undefined
        ? undefined
        : await bcrypt.hash(password, PASSWORD_HASH_ROUNDS)

    try {
      await authRepository.updateMe(
        {
          ...fields,
          ...(localeChanged && {
            preferredLocale: locale,
            countryCode: country,
          }),
          email,
          userName,
          passwordHash,
        },
        userId,
        verification
      )
    } catch (error) {
      // Another request took the email or username between the checks above
      // and this write; the unique constraint doesn't say which.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code == "P2002"
      ) {
        throw new AppError(
          "An account with this email or username already exists",
          400,
          "EMAIL_OR_USERNAME_ALREADY_EXISTS"
        )
      }
      throw error
    }

    return this.getCurrentUser(userId)
  },
}
