import { KAFKA_TOPICS } from "@nexora/kafka"
import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/auth-db"
import { UpdateMeFormValues } from "@nexora/schemas/auth/update-me"

const users = db.orm.public.User

type CreateRegistrationInput = {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  userName: string
  preferredLocale: string
  countryCode: string
  tokenHash: string
  tokenExpiresAt: Temporal.Instant
  encryptedVerificationToken: string
}

type ReplaceVerificationTokenInput = {
  userId: string
  email: string
  preferredLocale: string
  countryCode: string
  tokenHash: string
  tokenExpiresAt: Temporal.Instant
  encryptedVerificationToken: string
  now: Temporal.Instant
}

/** updateMe() input as stored: the password arrives already hashed. */
type UpdateMeChanges = Omit<UpdateMeFormValues, "password"> & {
  passwordHash?: string
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const issueVerificationToken = async (
  tx: Transaction,
  input: ReplaceVerificationTokenInput
) => {
  // Expire earlier unused links so only the newest email works.
  // update() only touches the first matching row; this needs all of them.
  await tx.orm.public.EmailVerificationToken.where({
    userId: input.userId,
    usedAt: null,
  }).updateAndCount({
    expiresAt: input.now,
  })

  await tx.orm.public.EmailVerificationToken.create({
    userId: input.userId,
    tokenHash: input.tokenHash,
    expiresAt: input.tokenExpiresAt,
  })

  await tx.orm.public.OutboxEvent.create({
    eventType: KAFKA_TOPICS.EMAIL_VERIFICATION_REQUESTED,
    aggregateId: input.userId,
    payload: {
      userId: input.userId,
      email: input.email,
      encryptedVerificationToken: input.encryptedVerificationToken,
      locale: input.preferredLocale,
      country: input.countryCode,
    },
    status: "PENDING",
    attempts: 0,
    availableAt: input.now,
  })
}

export const authRepository = {
  async findById(id: string) {
    return await users.where({ id }).first()
  },

  async findByEmail(email: string) {
    return await users.where({ email }).first()
  },

  async findByUserName(userName: string) {
    return await users.where({ userName }).first()
  },

  async createUser(input: CreateRegistrationInput) {
    return db.transaction(async (tx) => {
      const user = await tx.orm.public.User.create({
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        userName: input.userName,
        preferredLocale: input.preferredLocale,
        countryCode: input.countryCode,
        systemRole: "USER",
        isEmailVerified: false,
        accountStatus: "ACTIVE",
      })

      await tx.orm.public.EmailVerificationToken.create({
        userId: user.id,
        tokenHash: input.tokenHash,
        expiresAt: input.tokenExpiresAt,
      })

      await tx.orm.public.OutboxEvent.create({
        eventType: "email.verification.requested",
        aggregateId: user.id,
        payload: {
          userId: user.id,
          email: user.email,
          encryptedVerificationToken: input.encryptedVerificationToken,
          locale: input.preferredLocale,
          country: input.countryCode,
        },
        status: "PENDING",
        attempts: 0,
        availableAt: Temporal.Now.instant(),
      })

      return user
    })
  },

  async findValidVerificationToken(tokenHash: string) {
    return db.orm.public.EmailVerificationToken.where({
      tokenHash,
      usedAt: null,
    }).first()
  },

  async findLatestVerificationToken(userId: string) {
    const tokens = await db.orm.public.EmailVerificationToken.where({
      userId,
    }).all()

    return (
      tokens.sort(
        (a, b) => Temporal.Instant.compare(b.createdAt, a.createdAt) // Sort tokens by creation date in descending order
      )[0] ?? null
    )
  },

  async replaceVerificationToken(input: ReplaceVerificationTokenInput) {
    return db.transaction((tx) => issueVerificationToken(tx, input))
  },

  async verifyEmail(tokenHash: string, now: Temporal.Instant) {
    return db.transaction(async (tx) => {
      const token = await tx.orm.public.EmailVerificationToken.where({
        tokenHash,
        usedAt: null,
      }).first()

      if (!token || Temporal.Instant.compare(token.expiresAt, now) <= 0) {
        return false
      }

      await tx.orm.public.EmailVerificationToken.where({ id: token.id }).update(
        {
          usedAt: now,
        }
      )

      await tx.orm.public.User.where({ id: token.userId }).update({
        isEmailVerified: true,
        emailVerifiedAt: now,
      })

      // Locale and country live on the user, not the verification token.
      const user = await tx.orm.public.User.where({ id: token.userId }).first()

      if (!user) {
        return false
      }

      // Create onboarding process for the email verified user through an outbox event (Kafka)
      await tx.orm.public.OutboxEvent.create({
        eventType: KAFKA_TOPICS.INITIATE_USER_ONBOARDING,
        aggregateId: user.id,
        payload: {
          userId: user.id,
          locale: user.preferredLocale,
          country: user.countryCode,
        },
        status: "PENDING",
        attempts: 0,
        availableAt: now,
      })

      return true
    })
  },

  async findByIdentifier(identifier: string) {
    return db.orm.public.User.where((user, { fns }) =>
      fns.or(user.email.eq(identifier), user.userName.eq(identifier))
    ).first()
  },

  async createRefreshSession(input: {
    userId: string
    tokenHash: string
    expiresAt: Temporal.Instant
  }) {
    return db.orm.public.RefreshSession.create({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    })
  },

  async findRefreshSessionByHash(tokenHash: string) {
    return db.orm.public.RefreshSession.where({ tokenHash }).first()
  },

  async rotateRefreshSession(input: {
    sessionId: string
    userId: string
    tokenHash: string
    expiresAt: Temporal.Instant
    now: Temporal.Instant
  }) {
    return db.transaction(async (tx) => {
      const session = await tx.orm.public.RefreshSession.where({
        id: input.sessionId,
        userId: input.userId,
        revokedAt: null,
      }).first()

      if (!session) {
        return false
      }
      // Check if the session has expired
      if (Temporal.Instant.compare(session.expiresAt, input.now) <= 0) {
        return false
      }

      const updateResult = await tx.orm.public.RefreshSession.where({
        id: input.sessionId,
        userId: input.userId,
        revokedAt: null,
      }).update({
        revokedAt: input.now,
        lastUsedAt: input.now,
      })

      // IMPORTANT:
      // Verify your generated contract's updateResult shape.
      // Do not create a replacement session unless the update
      // confirms that exactly one active session was revoked.
      if (!updateResult) {
        return false
      }

      await tx.orm.public.RefreshSession.create({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      })

      return true
    })
  },

  async revokeRefreshSession(sessionId: string, now: Temporal.Instant) {
    return db.orm.public.RefreshSession.where({
      id: sessionId,
      revokedAt: null,
    }).update({
      revokedAt: now,
      lastUsedAt: now,
    })
  },

  async revokeAllRefreshSessions(userId: string, now: Temporal.Instant) {
    // update() only touches the first matching row; every session must end.
    return db.orm.public.RefreshSession.where({
      userId,
      revokedAt: null,
    }).updateAndCount({
      revokedAt: now,
      lastUsedAt: now,
    })
  },

  /**
   * Pass `verification` when the email changed: the account goes back to
   * unverified and a link is sent to the new address in the same transaction,
   * so it is never unverified without a working link.
   */
  async updateMe(
    input: UpdateMeChanges,
    userId: string,
    verification?: Omit<ReplaceVerificationTokenInput, "userId">
  ) {
    // Only the fields sent are written; the rest keep their current value.
    const changes = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined)
    ) as UpdateMeChanges

    return db.transaction(async (tx) => {
      await tx.orm.public.User.where({ id: userId }).update({
        ...changes,
        ...(verification && { isEmailVerified: false, emailVerifiedAt: null }),
      })

      if (verification) {
        await issueVerificationToken(tx, { ...verification, userId })
      }
    })
  },
}
