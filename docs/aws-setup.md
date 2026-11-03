# AWS setup and organization code (archived)

Archived on 2026-11-03. Everything for the organization request / create
organization flow and the S3 media uploads was taken out of the codebase and
kept here so it can be copied back.

What was removed:

- `services/organization-service`: the whole service.
- `services/media-service`: the whole service (S3 presigned uploads).
- `apps/admin/lib/api/organization/*` and `apps/admin/lib/api/media/*`.
- `packages/schemas/src/media/upload.ts`,
  `packages/schemas/src/organization/review-organization-request.ts`, and the
  request-body schema in `create-organization.ts`.
- `packages/shared/src/types/organization.ts` and `media.ts`.
- The `/api/v1/media` and `/api/v1/organization` gateway routes and their env
  vars, the organization-service entries in `turbo.json` and
  `scripts/prisma.mjs`, and the S3 origin in the admin app's CSP.
- The organization request section of the onboarding review page.

What stayed: the create organization form. On submit it only logs the values
to the console.

Not copied here: `.env` files (they hold secrets), and the generated Prisma
files (`contract.d.ts`, `contract.json`, `migrations/`). Regenerate those
from `contract.prisma`. The S3 bucket and IAM walkthrough is in
[aws/S3/s3-file-uploads-setup.md](aws/S3/s3-file-uploads-setup.md).

Env vars that were in use (fill in your own values):

```bash
# apps/admin/.env
MEDIA_UPLOAD_ORIGIN=https://<bucket>.s3.<region>.amazonaws.com

# services/api-gateway/.env
MEDIA_SERVICE_URL=http://localhost:<port>
ORGANIZATION_SERVICE_URL=http://localhost:<port>
```

For `services/media-service/.env` and `services/organization-service/.env`,
see each service's `src/config/*-env.ts` below for the variables it reads.

## Organization service

The whole `services/organization-service` package.

### `services/organization-service/.gitignore`

````
node_modules/
dist/
.env
````

### `services/organization-service/.prettierignore`

````
dist/
node_modules/
migrations/
src/prisma/contract.d.ts
src/prisma/contract.json
````

### `services/organization-service/eslint.config.js`

````js
import { config } from "@nexora/eslint-config/node"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["migrations/**", "src/prisma/contract.d.ts"],
  },
]
````

### `services/organization-service/package.json`

````json
{
  "name": "@nexora/organization-service",
  "version": "1.0.0",
  "description": "Nexora Organization service",
  "main": "src/organization-server.ts",
  "scripts": {
    "dev": "tsx watch src/organization-server.ts",
    "start": "node dist/organization-server.js",
    "build": "tsc",
    "prisma:emit": "prisma contract emit",
    "prisma:migration:plan": "prisma migration plan --name 'give name'",
    "prisma:db:migrate": "prisma db migrate --advance-ref db",
    "lint": "eslint",
    "format": "prettier --write \"src/**/*.ts\" prisma.config.ts",
    "typecheck": "tsc --noEmit",
    "outbox:dev": "tsx watch src/workers/organization-outbox-worker.ts"
  },
  "keywords": [
    "nexora",
    "organization",
    "service"
  ],
  "author": "Bharathi Kannaa",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "@nexora/kafka": "workspace:*",
    "@nexora/outbox": "workspace:*",
    "@nexora/schemas": "workspace:*",
    "@nexora/shared": "workspace:*",
    "@prisma/orm-postgres": "8.0.0-rc.20",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^18.0.7",
    "express": "^5.3.0",
    "helmet": "^8.3.0",
    "temporal-polyfill": "^1.0.6",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@nexora/eslint-config": "workspace:*",
    "@prisma/cli-engine": "0.9.0",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "^26.6.5",
    "eslint": "^10",
    "prisma": "8.0.0-rc.27",
    "tsx": "^4.23.15",
    "typescript": "^7.0.2"
  }
}
````

### `services/organization-service/prisma.config.ts`

````ts
import "dotenv/config"
import { definePrismaConfig } from "@prisma/cli-engine"
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config"

const config: ReturnType<typeof definePrismaConfig> = definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env["ORGANIZATION_DATABASE_URL"],
    },
  }),
})

export default config
````

### `services/organization-service/src/clients/service-client.ts`

````ts
import type { ApiErrorResponse } from "@nexora/shared/types/api"
import { AppError } from "@nexora/shared/express/app-error"
import { env } from "../config/organization-env"

type ServiceName = "onboarding" | "media"

const baseUrls: Record<ServiceName, string> = {
  onboarding: env.ONBOARDING_SERVICE_URL,
  media: env.MEDIA_SERVICE_URL,
}

// Read defensively: a proxy or crashed service may not send the envelope.
type ServiceErrorBody = Partial<Record<keyof ApiErrorResponse, unknown>>

interface ServiceRequest {
  method?: "GET" | "POST"
  body?: unknown
  /** Sent as x-user-id, as the gateway would after authenticating. */
  userId?: string
}

// Calls services directly, not through the gateway, with the internal secret.
export const callService = async <T>(
  service: ServiceName,
  path: string,
  { method = "GET", body, userId }: ServiceRequest = {}
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(new URL(path, baseUrls[service]), {
      method,
      headers: {
        accept: "application/json",
        "x-internal-secret": env.INTERNAL_SERVICE_SECRET,
        ...(userId && { "x-user-id": userId }),
        ...(body !== undefined && { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(env.SERVICE_TIMEOUT_MS),
    })
  } catch (error) {
    console.error(`Organization service: ${service} service unreachable`, error)
    throw new AppError("Service unavailable", 502, "SERVICE_UNAVAILABLE")
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errorBody = (responseBody ?? {}) as ServiceErrorBody

    throw new AppError(
      typeof errorBody.message === "string"
        ? errorBody.message
        : "Service request failed",
      response.status,
      typeof errorBody.code === "string"
        ? errorBody.code
        : "SERVICE_REQUEST_FAILED"
    )
  }

  if (
    typeof responseBody !== "object" ||
    responseBody === null ||
    !("data" in responseBody)
  ) {
    throw new AppError("Service unavailable", 502, "SERVICE_UNAVAILABLE")
  }

  return responseBody.data as T
}
````

### `services/organization-service/src/config/organization-env.ts`

````ts
import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4004),
  ORGANIZATION_DATABASE_URL: z.url(),
  // An empty secret would let any caller pass verifyGateway and set x-user-id.
  INTERNAL_SERVICE_SECRET: z.string().min(32),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3001")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  KAFKA_BROKERS: z.string().transform((val) =>
    val
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean)
  ),
  KAFKA_CLIENT_ID: z.string(),
  // Admin permissions come from onboarding-service; private files are signed
  // and copied by media-service.
  ONBOARDING_SERVICE_URL: z.url(),
  MEDIA_SERVICE_URL: z.url(),
  // Per downstream call, so one slow service can't hold the whole response.
  SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
})

export const env = envSchema.parse(process.env)
````

### `services/organization-service/src/modules/organization-controller.ts`

````ts
import type { Request, RequestHandler, Response } from "express"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import { createOrganizationRequestSchema } from "@nexora/schemas/organization/create-organization"
import {
  listOrganizationRequestsQuerySchema,
  rejectOrganizationRequestSchema,
} from "@nexora/schemas/organization/review-organization-request"
import {
  approveCreateRequestService,
  getMyCreateRequestService,
  getOrganizationLogoUrlService,
  getOrganizationStatus,
  getRequestLogoUrlService,
  getRequestService,
  listCreateRequestsService,
  rejectRequestService,
  submitCreateRequestService,
} from "./organization-service"

const getUserId = (req: Request) => {
  const userId = req.headers["x-user-id"]

  if (typeof userId !== "string" || !userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
  }

  return userId
}

// Express 5 types route params as string | string[].
const getParam = (req: Request, name: string) => {
  const value = req.params[name]
  return typeof value === "string" ? value : ""
}

export const getStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const status = await getOrganizationStatus(getUserId(req))

    return sendSuccess(
      res,
      200,
      "Organization status fetched",
      "ORGANIZATION_STATUS_FETCHED",
      status
    )
  }
)

export const submitCreateRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req)
    const input = createOrganizationRequestSchema().parse(req.body)
    const data = await submitCreateRequestService(userId, input)

    return sendSuccess(
      res,
      200,
      "Organization request submitted",
      "ORGANIZATION.REQUEST_SUBMITTED.SUCCESS",
      data
    )
  }
)

export const getMyCreateRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getMyCreateRequestService(getUserId(req))

    return sendSuccess(
      res,
      200,
      "Organization request fetched",
      "ORGANIZATION.REQUEST_FETCHED",
      data
    )
  }
)

export const listCreateRequests: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req)
    const { status } = listOrganizationRequestsQuerySchema.parse(req.query)
    const data = await listCreateRequestsService(userId, status)

    return sendSuccess(
      res,
      200,
      "Organization requests fetched",
      "ORGANIZATION.REQUESTS_FETCHED",
      data
    )
  }
)

export const getRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getRequestService(
      getUserId(req),
      getParam(req, "requestId")
    )

    return sendSuccess(
      res,
      200,
      "Organization request fetched",
      "ORGANIZATION.REQUEST_FETCHED",
      data
    )
  }
)

export const getRequestLogoUrl: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getRequestLogoUrlService(
      getUserId(req),
      getParam(req, "requestId")
    )

    return sendSuccess(
      res,
      200,
      "Logo URL created",
      "ORGANIZATION.LOGO_URL_CREATED",
      data
    )
  }
)

export const approveCreateRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await approveCreateRequestService(
      getUserId(req),
      getParam(req, "requestId")
    )

    return sendSuccess(
      res,
      200,
      "Organization request approved",
      "ORGANIZATION.REQUEST_APPROVED.SUCCESS",
      data
    )
  }
)

export const rejectRequest: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req)
    const { reviewComment } = rejectOrganizationRequestSchema.parse(req.body)
    const data = await rejectRequestService(
      userId,
      getParam(req, "requestId"),
      reviewComment
    )

    return sendSuccess(
      res,
      200,
      "Organization request rejected",
      "ORGANIZATION.REQUEST_REJECTED.SUCCESS",
      data
    )
  }
)

export const getOrganizationLogoUrl: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getOrganizationLogoUrlService(
      getUserId(req),
      getParam(req, "organizationId")
    )

    return sendSuccess(
      res,
      200,
      "Logo URL created",
      "ORGANIZATION.LOGO_URL_CREATED",
      data
    )
  }
)
````

### `services/organization-service/src/modules/organization-repository.ts`

````ts
import type { CreateOrganizationRequestInput } from "@nexora/schemas/organization/create-organization"
import type { OrganizationRequestStatus } from "@nexora/shared/types/organization"
import { Temporal } from "temporal-polyfill"
import { db } from "../prisma/organization-db"

export const countPendingEventsForUser = async (
  userId: string
): Promise<number> => {
  const events = await db.orm.public.OutboxEvent.where({
    aggregateId: userId,
    status: "PENDING",
  }).all()

  return events.length
}

const toRequestColumns = (input: CreateOrganizationRequestInput) => ({
  proposedName: input.proposedName,
  proposedSlug: input.proposedSlug,
  proposedDescription: input.proposedDescription,
  proposedCountryCode: input.proposedCountryCode,
  proposedIndustry: input.proposedIndustry,
  proposedSize: input.proposedSize,
  // Blank means none.
  proposedWebsite: input.proposedWebsite || null,
  proposedLogoObjectKey: input.proposedLogoObjectKey,
  proposedTaxDetails: input.proposedTaxDetails,
  proposedAddress: input.proposedAddress,
})

export const findRequestByIdRepository = (requestId: string) =>
  db.orm.public.OrganizationRequest.where({ id: requestId }).first()

export const findCreateRequestsByUserRepository = async (userId: string) =>
  await db.orm.public.OrganizationRequest.where({
    userId,
    type: "CREATE",
  }).all()

export const findCreateRequestsBySlugRepository = async (
  proposedSlug: string
) =>
  await db.orm.public.OrganizationRequest.where({
    proposedSlug,
    type: "CREATE",
  }).all()

export const findCreateRequestsByCountryRepository = async (
  proposedCountryCode: string,
  status?: OrganizationRequestStatus
) =>
  await db.orm.public.OrganizationRequest.where({
    proposedCountryCode,
    type: "CREATE",
    ...(status && { organizationRequestStatus: status }),
  }).all()

export const findOrganizationBySlugRepository = (slug: string) =>
  db.orm.public.Organization.where({ slug }).first()

export const findOrganizationByIdRepository = (organizationId: string) =>
  db.orm.public.Organization.where({ id: organizationId }).first()

export const findActiveMembershipRepository = (
  organizationId: string,
  userId: string
) =>
  db.orm.public.OrganizationMembership.where({
    organizationId,
    userId,
    isActive: true,
  }).first()

/**
 * Saves the user's CREATE request: replaces their PENDING one when they come
 * back and submit again, else starts a new one.
 */
export const saveCreateRequestRepository = async (
  userId: string,
  pendingRequestId: string | null,
  input: CreateOrganizationRequestInput
) => {
  const columns = toRequestColumns(input)

  if (pendingRequestId) {
    // Only while it's still PENDING: a review that started meanwhile wins.
    return db.orm.public.OrganizationRequest.where({
      id: pendingRequestId,
      organizationRequestStatus: "PENDING",
    }).update({ ...columns, submittedAt: Temporal.Now.instant() })
  }

  return db.orm.public.OrganizationRequest.create({
    ...columns,
    userId,
    type: "CREATE",
  })
}

/**
 * Creates the organization from an approved CREATE request, in one
 * transaction: the organization, the requester as its active OWNER, and the
 * request marked APPROVED. `copyLogo` runs inside it, so a failed copy rolls
 * everything back. Returns null, writing nothing, when the request was
 * reviewed by someone else in the meantime.
 */
export const approveCreateRequestRepository = async (
  request: {
    id: string
    userId: string
    organizationRequestStatus: OrganizationRequestStatus
    proposedName: string
    proposedSlug: string
    proposedDescription: string | null
    proposedCountryCode: string
    proposedLogoObjectKey: string | null
  },
  reviewerId: string,
  copyLogo: (organizationId: string) => Promise<string | null>
) => {
  return db.transaction(async (tx) => {
    const now = Temporal.Now.instant()

    const claimed = await tx.orm.public.OrganizationRequest.where({
      id: request.id,
      organizationRequestStatus: request.organizationRequestStatus,
    }).update({
      organizationRequestStatus: "APPROVED",
      reviewedByUserId: reviewerId,
      reviewedAt: now,
    })

    if (!claimed) return null

    const created = await tx.orm.public.Organization.create({
      name: request.proposedName,
      slug: request.proposedSlug,
      description: request.proposedDescription,
      countryCode: request.proposedCountryCode,
      status: "ACTIVE",
      createdByUserId: request.userId,
    })

    const logoObjectKey = await copyLogo(created.id)

    const organization = logoObjectKey
      ? await tx.orm.public.Organization.where({ id: created.id }).update({
          logoObjectKey,
        })
      : created

    await tx.orm.public.OrganizationMembership.create({
      organizationId: created.id,
      userId: request.userId,
      role: "OWNER",
      isActive: true,
      joinedAt: now,
    })

    const approved = await tx.orm.public.OrganizationRequest.where({
      id: request.id,
    }).update({ organizationId: created.id })

    if (!approved || !organization) {
      throw new Error("Organization request disappeared mid-transaction")
    }

    return { request: approved, organization }
  })
}

/** Returns null when the request was reviewed by someone else meanwhile. */
export const rejectRequestRepository = (
  request: { id: string; organizationRequestStatus: OrganizationRequestStatus },
  reviewerId: string,
  reviewComment: string
) =>
  db.orm.public.OrganizationRequest.where({
    id: request.id,
    organizationRequestStatus: request.organizationRequestStatus,
  }).update({
    organizationRequestStatus: "REJECTED",
    reviewedByUserId: reviewerId,
    reviewedAt: Temporal.Now.instant(),
    reviewComment,
  })
````

### `services/organization-service/src/modules/organization-routes.ts`

````ts
import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/organization-env"
import {
  approveCreateRequest,
  getMyCreateRequest,
  getOrganizationLogoUrl,
  getRequest,
  getRequestLogoUrl,
  getStatus,
  listCreateRequests,
  rejectRequest,
  submitCreateRequest,
} from "./organization-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.use(verifyGateway)

router.get("/status", getStatus)

// The requester's own CREATE request.
router.post("/requests", submitCreateRequest)
router.get("/requests/me", getMyCreateRequest)

// The requester, or admins with ORGANIZATION_MANAGEMENT in its country.
router.get("/requests", listCreateRequests)
router.get("/requests/:requestId", getRequest)
router.get("/requests/:requestId/logo-url", getRequestLogoUrl)
router.post("/requests/:requestId/approve", approveCreateRequest)
router.post("/requests/:requestId/reject", rejectRequest)

// Active members, or admins with ORGANIZATION_MANAGEMENT in its country.
router.get("/organizations/:organizationId/logo-url", getOrganizationLogoUrl)

export default router
````

### `services/organization-service/src/modules/organization-service.ts`

````ts
import type { CreateOrganizationRequestInput } from "@nexora/schemas/organization/create-organization"
import type { PermissionAction } from "@nexora/schemas/onboarding/become-admin"
import { AppError } from "@nexora/shared/express/app-error"
import type { GrantedPermissionsResponseData } from "@nexora/shared/types/onboarding"
import type {
  FileUrlResponseData,
  OrganizationRequestStatus,
} from "@nexora/shared/types/organization"
import { Temporal } from "temporal-polyfill"
import { callService } from "../clients/service-client"
import {
  approveCreateRequestRepository,
  countPendingEventsForUser,
  findActiveMembershipRepository,
  findCreateRequestsByCountryRepository,
  findCreateRequestsBySlugRepository,
  findCreateRequestsByUserRepository,
  findOrganizationByIdRepository,
  findOrganizationBySlugRepository,
  findRequestByIdRepository,
  rejectRequestRepository,
  saveCreateRequestRepository,
} from "./organization-repository"

// Still waiting for a decision; a slug held by one of these is taken.
const OPEN_STATUSES: readonly OrganizationRequestStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
]

const requestNotFound = () =>
  new AppError(
    "Organization request not found",
    404,
    "ORGANIZATION.REQUEST_NOT_FOUND"
  )

export const getOrganizationStatus = async (userId: string) => {
  const pendingEvents = await countPendingEventsForUser(userId)

  return { userId, pendingEvents }
}

/**
 * Countries (uppercase) where the user may `action` ORGANIZATION_MANAGEMENT,
 * from their approved admin access requests.
 */
const getAdminCountries = async (
  userId: string,
  action: PermissionAction
): Promise<Set<string>> => {
  const { permissions } = await callService<GrantedPermissionsResponseData>(
    "onboarding",
    "/api/v1/onboarding/granted-permissions",
    { userId }
  )

  return new Set(
    permissions
      .filter(
        ({ moduleCode, accessLevel }) =>
          moduleCode === "ORGANIZATION_MANAGEMENT" && accessLevel === action
      )
      .map(({ countryCode }) => countryCode.toUpperCase())
  )
}

const isCountryAdmin = async (
  userId: string,
  countryCode: string,
  action: PermissionAction
) => (await getAdminCountries(userId, action)).has(countryCode.toUpperCase())

const signFileUrl = (key: string) =>
  callService<FileUrlResponseData>("media", "/internal/v1/files/url", {
    method: "POST",
    body: { key },
  })

/**
 * The request, if `userId` may see it: its requester, or an admin with
 * ORGANIZATION_MANAGEMENT VIEW in its country. Anyone else gets a 404, so
 * they can't tell whether it exists.
 */
const getViewableRequest = async (userId: string, requestId: string) => {
  const request = await findRequestByIdRepository(requestId)

  if (!request) throw requestNotFound()

  if (
    request.userId !== userId &&
    !(await isCountryAdmin(userId, request.proposedCountryCode, "VIEW"))
  ) {
    throw requestNotFound()
  }

  return request
}

/** The request, if `reviewerId` may decide it, and it's still open. */
const getReviewableRequest = async (reviewerId: string, requestId: string) => {
  const request = await getViewableRequest(reviewerId, requestId)

  if (
    request.userId === reviewerId ||
    !(await isCountryAdmin(reviewerId, request.proposedCountryCode, "EDIT"))
  ) {
    throw new AppError(
      "You can't review this organization request",
      403,
      "FORBIDDEN"
    )
  }

  if (!OPEN_STATUSES.includes(request.organizationRequestStatus)) {
    throw new AppError(
      "This organization request has already been reviewed",
      409,
      "ORGANIZATION.REQUEST_ALREADY_REVIEWED"
    )
  }

  return request
}

const assertSlugAvailable = async (slug: string, ownRequestId?: string) => {
  const [organization, requests] = await Promise.all([
    findOrganizationBySlugRepository(slug),
    findCreateRequestsBySlugRepository(slug),
  ])

  const heldByOpenRequest = requests.some(
    (request) =>
      request.id !== ownRequestId &&
      OPEN_STATUSES.includes(request.organizationRequestStatus)
  )

  if (organization || heldByOpenRequest) {
    throw new AppError(
      "This slug is already taken",
      409,
      "ORGANIZATION.SLUG_TAKEN"
    )
  }
}

/**
 * Submits the user's CREATE request, replacing their PENDING one if they
 * submit again. The logo must be one media-service saved for this user.
 */
export const submitCreateRequestService = async (
  userId: string,
  input: CreateOrganizationRequestInput
) => {
  const logoPrefix = `private/organization-requests/${userId}/logo/`
  const logoKey = input.proposedLogoObjectKey

  if (!logoKey.startsWith(logoPrefix) || logoKey.includes("..")) {
    throw new AppError(
      "Upload the logo again",
      400,
      "ORGANIZATION.LOGO_INVALID"
    )
  }

  const ownRequests = await findCreateRequestsByUserRepository(userId)

  if (
    ownRequests.some(
      (request) => request.organizationRequestStatus === "UNDER_REVIEW"
    )
  ) {
    throw new AppError(
      "Your organization request is being reviewed and can't be changed",
      409,
      "ORGANIZATION.REQUEST_LOCKED"
    )
  }

  const pending = ownRequests.find(
    (request) => request.organizationRequestStatus === "PENDING"
  )

  await assertSlugAvailable(input.proposedSlug, pending?.id)

  const saved = await saveCreateRequestRepository(
    userId,
    pending?.id ?? null,
    input
  )

  // A review started between the checks and the write.
  if (!saved) {
    throw new AppError(
      "Your organization request is being reviewed and can't be changed",
      409,
      "ORGANIZATION.REQUEST_LOCKED"
    )
  }

  return { request: saved }
}

/** The user's latest CREATE request, or null before the first submit. */
export const getMyCreateRequestService = async (userId: string) => {
  const requests = await findCreateRequestsByUserRepository(userId)

  const latest = requests.reduce<(typeof requests)[number] | null>(
    (latest, request) =>
      !latest ||
      Temporal.Instant.compare(request.submittedAt, latest.submittedAt) > 0
        ? request
        : latest,
    null
  )

  return { request: latest }
}

/** The CREATE requests in every country the admin may view, newest first. */
export const listCreateRequestsService = async (
  userId: string,
  status?: OrganizationRequestStatus
) => {
  const countries = [...(await getAdminCountries(userId, "VIEW"))]

  if (countries.length === 0) {
    throw new AppError(
      "You can't review organization requests",
      403,
      "FORBIDDEN"
    )
  }

  const perCountry = await Promise.all(
    countries.map((country) =>
      findCreateRequestsByCountryRepository(country, status)
    )
  )

  const requests = perCountry
    .flat()
    .sort((a, b) => Temporal.Instant.compare(b.submittedAt, a.submittedAt))

  return { requests }
}

export const getRequestService = async (userId: string, requestId: string) => ({
  request: await getViewableRequest(userId, requestId),
})

export const getRequestLogoUrlService = async (
  userId: string,
  requestId: string
) => {
  const request = await getViewableRequest(userId, requestId)

  if (!request.proposedLogoObjectKey) throw requestNotFound()

  return signFileUrl(request.proposedLogoObjectKey)
}

/**
 * Approves a CREATE request: creates the organization with the requester as
 * OWNER, and copies the logo from the request's files to the organization's.
 */
export const approveCreateRequestService = async (
  reviewerId: string,
  requestId: string
) => {
  const request = await getReviewableRequest(reviewerId, requestId)

  if (
    request.type !== "CREATE" ||
    !request.proposedName ||
    !request.proposedSlug
  ) {
    throw new AppError(
      "Only complete create requests can be approved",
      400,
      "ORGANIZATION.REQUEST_INCOMPLETE"
    )
  }

  await assertSlugAvailable(request.proposedSlug, request.id)

  const logoKey = request.proposedLogoObjectKey

  const approved = await approveCreateRequestRepository(
    {
      ...request,
      proposedName: request.proposedName,
      proposedSlug: request.proposedSlug,
    },
    reviewerId,
    async (organizationId) => {
      if (!logoKey) return null

      // Keeps the file's own name (its UUID and extension).
      const fileName = logoKey.slice(logoKey.lastIndexOf("/") + 1)
      const { objectKey } = await callService<{ objectKey: string }>(
        "media",
        "/internal/v1/files/copy",
        {
          method: "POST",
          body: {
            sourceKey: logoKey,
            targetKey: `private/organizations/${organizationId}/logo/${fileName}`,
          },
        }
      )
      return objectKey
    }
  )

  if (!approved) {
    throw new AppError(
      "This organization request has already been reviewed",
      409,
      "ORGANIZATION.REQUEST_ALREADY_REVIEWED"
    )
  }

  return approved
}

export const rejectRequestService = async (
  reviewerId: string,
  requestId: string,
  reviewComment: string
) => {
  const request = await getReviewableRequest(reviewerId, requestId)

  const rejected = await rejectRequestRepository(
    request,
    reviewerId,
    reviewComment
  )

  if (!rejected) {
    throw new AppError(
      "This organization request has already been reviewed",
      409,
      "ORGANIZATION.REQUEST_ALREADY_REVIEWED"
    )
  }

  return { request: rejected }
}

/**
 * A signed link to an organization's logo, for its active members and admins
 * with ORGANIZATION_MANAGEMENT VIEW in its country.
 */
export const getOrganizationLogoUrlService = async (
  userId: string,
  organizationId: string
) => {
  const organization = await findOrganizationByIdRepository(organizationId)

  const notFound = new AppError(
    "Organization not found",
    404,
    "ORGANIZATION.NOT_FOUND"
  )

  if (!organization) throw notFound

  const allowed =
    !!(await findActiveMembershipRepository(organizationId, userId)) ||
    (await isCountryAdmin(userId, organization.countryCode, "VIEW"))

  if (!allowed || !organization.logoObjectKey) throw notFound

  return signFileUrl(organization.logoObjectKey)
}
````

### `services/organization-service/src/organization-app.ts`

````ts
import express, { Express } from "express"
import helmet from "helmet"
import cors from "cors"
import { env } from "./config/organization-env"
import cookieParser from "cookie-parser"
import organizationRoutes from "./modules/organization-routes"
import {
  createErrorHandler,
  notFoundHandler,
} from "@nexora/shared/express/error-handler"

const app: Express = express()

app.disable("x-powered-by")

app.use(helmet())

app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  })
)

app.use(express.json({ limit: "10kb" }))

app.use(express.urlencoded({ extended: false }))

app.use(cookieParser())

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "nexora-organization-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/organization", organizationRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("Organization service"))

export default app
````

### `services/organization-service/src/organization-server.ts`

````ts
import app from "./organization-app"
import { env } from "./config/organization-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Organization service running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Organization service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Organization service:", error)
    } else {
      console.log("Organization service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
````

### `services/organization-service/src/outbox/organization-outbox-publisher.ts`

````ts
import { createOutboxPublisher } from "@nexora/outbox"
import { db } from "../prisma/organization-db"

export const { publishPendingOutboxEvents, startOutboxPublisher } =
  createOutboxPublisher({
    serviceName: "organization",
    outboxEvents: db.orm.public.OutboxEvent,
    // Map each event type this service publishes to its payload handler,
    // e.g. "organization.created": parseObjectPayload
    handlers: {},
  })
````

### `services/organization-service/src/prisma/contract.prisma`

````prisma
// use prisma-8
enum OutboxEventStatus {
  PENDING
  PROCESSING
  PUBLISHED
  FAILED
}

enum OrganizationStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
}

enum OrganizationRequestType {
  JOIN
  CREATE
}

enum OrganizationRequestStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  WITHDRAWN
}

enum OrganizationRole {
  OWNER
  ORG_ADMIN
  MEMBER
}

enum OrganizationDocumentScope {
  CREATE_ORGANIZATION
  JOIN_ORGANIZATION
}

enum OrganizationDocumentStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  REUPLOAD_REQUIRED
}

enum OrganizationDocumentType {
  ORGANIZATION_LOGO
  TAX_DOCUMENT
  BUSINESS_REGISTRATION
  PROOF_OF_ADDRESS
  IDENTITY_DOCUMENT
  RESIDENCE_PERMIT
  EMPLOYMENT_PROOF
  OTHER
}

model Organization {
  id              String                   @id @onCreate(cuid(2))
  name            String
  slug            String                   @unique
  description     String?
  countryCode     String
  status          OrganizationStatus       @default(PENDING)

  // Auth Service user ID of the creator.
  createdByUserId String

  // Private S3 object key for the approved logo, if available.
  logoObjectKey   String?

  memberships     OrganizationMembership[]
  requests        OrganizationRequest[]

  createdAt       DateTime                 @default(now())
  updatedAt       temporal.updatedAt()

  @@index([countryCode, status])
  @@index([createdByUserId])
}

model OrganizationMembership {
  id             String               @id @onCreate(cuid(2))
  organizationId String
  userId         String

  role           OrganizationRole     @default(MEMBER)
  isActive       Boolean              @default(false)

  joinedAt       DateTime?
  createdAt      DateTime             @default(now())
  updatedAt      temporal.updatedAt()

  organization   Organization         @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([userId, isActive])
}

// Both JOIN and CREATE application workflows.
model OrganizationRequest {
  id                        String                        @id @onCreate(cuid(2))
  userId                    String

  // JOIN: selected existing organization.
  // CREATE: null until an organization is created.
  organizationId            String?

  type                      OrganizationRequestType
  organizationRequestStatus OrganizationRequestStatus     @default(PENDING)

  // For joining an existing organization.
  message                   String?
  employeeId                String?
  jobTitle                  String?
  department                String?
  workEmail                 String?
  joiningDate               DateTime?
  reportingManager          String?

  // For creating an organization.
  proposedName              String?
  proposedSlug              String?
  proposedDescription       String?
  proposedCountryCode       String
  proposedIndustry          String?
  proposedSize              String?
  proposedWebsite           String?
  proposedLogoObjectKey     String?

  // Country-specific fields validated by the backend.
  proposedTaxDetails        Json?
  proposedAddress           Json?

  reviewedByUserId          String?
  reviewedAt                DateTime?
  reviewComment             String?

  submittedAt               DateTime                      @default(now())
  updatedAt                 temporal.updatedAt()

  organization              Organization?                 @relation(fields: [organizationId], references: [id], onDelete: Restrict)

  // Associated documents for the organization request.
  documents                 OrganizationRequestDocument[]

  @@index([userId, organizationRequestStatus], name: "OrganizationRequest_userId_status_idx")
  @@index([organizationId, organizationRequestStatus], name: "OrganizationRequest_organizationId_status_idx")
  @@index([type, organizationRequestStatus, submittedAt], name: 'OrganizationRequest_type_status_submittedAt_idx')
}

// Configurable document rules per country and workflow.
model OrganizationDocumentRequirement {
  id               String                        @id @onCreate(cuid(2))

  code             String
  name             String
  description      String?

  countryCode      String
  scope            OrganizationDocumentScope
  documentType     OrganizationDocumentType

  isRequired       Boolean                       @default(true)
  isActive         Boolean                       @default(true)

  // Example: ["application/pdf", "image/jpeg", "image/png"]
  allowedMimeTypes Json
  maxFileSizeBytes BigInt?

  createdAt        DateTime                      @default(now())
  updatedAt        temporal.updatedAt()

  submissions      OrganizationRequestDocument[]

  @@unique([countryCode, scope, code])
  @@index([countryCode, scope, isActive], name: "OrgDocRequirement_countryCode_scope_isActive_idx")
}

model OrganizationRequestDocument {
  id               String                           @id @onCreate(cuid(2))

  requestId        String
  requirementId    String?

  documentType     OrganizationDocumentType
  status           OrganizationDocumentStatus       @default(PENDING)

  // Private S3 key, not a public URL.
  objectKey        String
  originalFileName String
  contentType      String
  sizeBytes        BigInt
  checksumSha256   String?

  reviewedByUserId String?
  reviewedAt       DateTime?
  reviewComment    String?

  createdAt        DateTime                         @default(now())
  updatedAt        temporal.updatedAt()

  request          OrganizationRequest              @relation(fields: [requestId], references: [id], onDelete: Cascade)

  requirement      OrganizationDocumentRequirement? @relation(fields: [requirementId], references: [id], onDelete: Restrict)

  @@index([requestId, status])
  @@index([requirementId])
  @@index([reviewedByUserId])
}

model OutboxEvent {
  id          String               @id @onCreate(cuid(2))
  eventType   String
  aggregateId String
  payload     Json
  status      OutboxEventStatus    @default(PENDING)
  attempts    Int                  @default(0)
  availableAt DateTime             @default(now())
  publishedAt DateTime?
  lastError   String?
  createdAt   DateTime             @default(now())
  updatedAt   temporal.updatedAt()

  @@index([status, availableAt])
  @@index([aggregateId])
}
````

### `services/organization-service/src/prisma/organization-db.ts`

````ts
// Node < 26.8.2 has no global Temporal; Prisma's temporal.updatedAt() and DateTime codecs need it.
import "temporal-polyfill/full/global"
import postgres, { type PostgresClient } from "@prisma/orm-postgres/runtime"
import { contractFromJson } from "@prisma/orm-postgres/static"
import { env } from "../config/organization-env"
import type { Contract } from "./contract.d"
import contractJson from "./contract.json" with { type: "json" }

export const contract = contractFromJson<Contract>(contractJson)

export const db: PostgresClient<Contract> = postgres({
  contract,
  url: env.ORGANIZATION_DATABASE_URL,
})
````

### `services/organization-service/src/workers/organization-outbox-worker.ts`

````ts
import "dotenv/config"
import "temporal-polyfill/full/global"
import { startOutboxPublisher } from "../outbox/organization-outbox-publisher"

startOutboxPublisher().catch((error: unknown) => {
  console.error("Outbox worker terminated unexpectedly", error)
  process.exitCode = 1
})
````

### `services/organization-service/tsconfig.json`

````json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "resolveJsonModule": true,
    "types": [
      "node"
    ]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
````

## Media service (AWS S3)

The whole `services/media-service` package.

### `services/media-service/.gitignore`

````
node_modules/
dist/
.env
````

### `services/media-service/.prettierignore`

````
dist/
node_modules/
````

### `services/media-service/eslint.config.js`

````js
import { config } from "@nexora/eslint-config/node"

/** @type {import("eslint").Linter.Config[]} */
export default config
````

### `services/media-service/package.json`

````json
{
  "name": "@nexora/media-service",
  "version": "1.0.0",
  "description": "Nexora Media service",
  "main": "src/media-server.ts",
  "scripts": {
    "dev": "tsx watch src/media-server.ts",
    "start": "node dist/media-server.js",
    "build": "tsc",
    "lint": "eslint",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "nexora",
    "media",
    "service"
  ],
  "author": "Bharathi Kannaa",
  "license": "ISC",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1161.0",
    "@aws-sdk/s3-request-presigner": "^3.1161.0",
    "@nexora/schemas": "workspace:*",
    "@nexora/shared": "workspace:*",
    "cors": "^2.8.6",
    "dotenv": "^18.0.7",
    "express": "^5.3.0",
    "file-type": "^22.3.0",
    "helmet": "^8.3.0",
    "zod": "^4.6.5"
  },
  "devDependencies": {
    "@nexora/eslint-config": "workspace:*",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "^26.6.5",
    "eslint": "^10",
    "tsx": "^4.23.15",
    "typescript": "^7.0.2"
  }
}
````

### `services/media-service/src/config/media-env.ts`

````ts
import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4006),
  // An empty secret would let any caller pass verifyGateway and set x-user-id.
  INTERNAL_SERVICE_SECRET: z.string().min(32),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3001")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  // Credentials aren't read here: the SDK finds AWS_PROFILE or the access
  // keys locally, and the task or instance role in AWS.
  AWS_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  // Presigned URLs stay short-lived; the bucket policy rejects older signatures.
  S3_UPLOAD_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(600)
    .default(300),
  S3_DOWNLOAD_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(600)
    .default(300),
})

export const env = envSchema.parse(process.env)
````

### `services/media-service/src/lib/s3-client.ts`

````ts
import { S3Client } from "@aws-sdk/client-s3"
import { env } from "../config/media-env"

export const s3 = new S3Client({
  region: env.AWS_REGION,
  // By default the SDK signs a checksum into presigned PUTs, computed over an
  // empty body, so the browser's real upload fails with SignatureDoesNotMatch.
  requestChecksumCalculation: "WHEN_REQUIRED",
})
````

### `services/media-service/src/media-app.ts`

````ts
import express, { Express } from "express"
import helmet from "helmet"
import cors from "cors"
import { env } from "./config/media-env"
import mediaRoutes from "./modules/media-routes"
import internalRoutes from "./modules/internal-routes"
import {
  createErrorHandler,
  notFoundHandler,
} from "@nexora/shared/express/error-handler"

const app: Express = express()

app.disable("x-powered-by")

app.use(helmet())

app.use(
  cors({
    origin: env.CLIENT_ORIGINS,
    credentials: true,
  })
)

// Only upload metadata comes through here; file bytes go straight to S3.
app.use(express.json({ limit: "10kb" }))

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "nexora-media-service is running",
    uptime: process.uptime(),
  })
})

app.use("/api/v1/media", mediaRoutes)
app.use("/internal/v1", internalRoutes)

app.use(notFoundHandler)
app.use(createErrorHandler("Media service"))

export default app
````

### `services/media-service/src/media-server.ts`

````ts
import app from "./media-app"
import { env } from "./config/media-env"

const server = app.listen(env.PORT, () => {
  console.log("Nexora Media service running on", env.PORT)
})

const shutdown = (signal: string) => {
  console.log(`${signal}, received`, "Closing Media service...")
  server.close((error) => {
    if (error) {
      console.error("Error closing Media service:", error)
    } else {
      console.log("Media service closed")
    }
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
````

### `services/media-service/src/modules/internal-routes.ts`

````ts
import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/media-env"
import { copyInternalFile, signInternalDownloadUrl } from "./media-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

// Service-to-service only. The gateway forwards nothing outside /api/v1/media,
// so users can't reach these; callers must check access before calling.
const router: Router = Router()

router.use(verifyGateway)

router.post("/files/url", signInternalDownloadUrl)
router.post("/files/copy", copyInternalFile)

export default router
````

### `services/media-service/src/modules/media-controller.ts`

````ts
import type { Request, RequestHandler, Response } from "express"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import {
  completeUploadSchema,
  copyFileSchema,
  createUploadSchema,
  downloadUrlSchema,
} from "@nexora/schemas/media/upload"
import {
  completeUploadService,
  copyInternalFileService,
  createUploadService,
  getDownloadUrlService,
  signInternalDownloadUrlService,
} from "./media-service"

export const createUpload: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

    const input = createUploadSchema.parse(req.body)
    const data = await createUploadService(userId, input)

    return sendSuccess(
      res,
      201,
      "Upload URL created",
      "MEDIA.UPLOAD_URL.CREATED",
      data
    )
  }
)

export const completeUpload: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

    const { key } = completeUploadSchema.parse(req.body)
    const data = await completeUploadService(userId, key)

    return sendSuccess(
      res,
      200,
      "Upload completed",
      "MEDIA.UPLOAD.COMPLETED",
      data
    )
  }
)

export const getDownloadUrl: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    }

    const input = downloadUrlSchema.parse(req.query)
    const data = await getDownloadUrlService(userId, input)

    return sendSuccess(
      res,
      200,
      "Download URL created",
      "MEDIA.DOWNLOAD_URL.CREATED",
      data
    )
  }
)

// Internal endpoints: organization-service has already authorized the user.

export const signInternalDownloadUrl: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = downloadUrlSchema.parse(req.body)
    const data = await signInternalDownloadUrlService(input)

    return sendSuccess(
      res,
      200,
      "Download URL created",
      "MEDIA.DOWNLOAD_URL.CREATED",
      data
    )
  }
)

export const copyInternalFile: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = copyFileSchema.parse(req.body)
    const data = await copyInternalFileService(input)

    return sendSuccess(res, 200, "File copied", "MEDIA.FILE.COPIED", data)
  }
)
````

### `services/media-service/src/modules/media-routes.ts`

````ts
import { Router } from "express"
import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"
import { env } from "../config/media-env"
import {
  completeUpload,
  createUpload,
  getDownloadUrl,
} from "./media-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.post("/uploads", verifyGateway, createUpload)
router.post("/uploads/complete", verifyGateway, completeUpload)
router.get("/files/url", verifyGateway, getDownloadUrl)

export default router
````

### `services/media-service/src/modules/media-service.ts`

````ts
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { fileTypeFromBuffer } from "file-type"
import { randomUUID } from "node:crypto"
import { AppError } from "@nexora/shared/express/app-error"
import {
  EXTENSION_BY_MIME,
  UPLOAD_PURPOSES,
  UPLOAD_RULES,
  type CreateUploadInput,
  type UploadPurpose,
} from "@nexora/schemas/media/upload"
import { env } from "../config/media-env"
import { s3 } from "../lib/s3-client"

// The user ID becomes part of object keys, so it must not contain "/".
const SAFE_USER_ID = /^[A-Za-z0-9_-]+$/

// tmp/{userId}/{purpose}/{uuid}.{ext}, exactly as createUploadService builds it.
const TMP_KEY = /^tmp\/([A-Za-z0-9_-]+)\/([a-z-]+)\/[0-9a-f-]{36}\.([a-z]+)$/

// Enough leading bytes for file-type to recognize every allowed format.
const SNIFF_BYTES = 4100

// file-type reports old .doc files by their container format.
const SNIFFED_MIME_ALIASES: Record<string, string> = {
  "application/x-cfb": "application/msword",
}

const assertSafeUserId = (userId: string) => {
  if (!SAFE_USER_ID.test(userId)) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
  }
}

const isUploadPurpose = (value: string): value is UploadPurpose =>
  (UPLOAD_PURPOSES as readonly string[]).includes(value)

/**
 * Files for an organization request, owned by the requester until it's
 * approved; organization-service then copies them under the organization.
 */
const requestFilesPrefix = (userId: string) =>
  `private/organization-requests/${userId}/`

const buildFinalKey = (purpose: UploadPurpose, userId: string, ext: string) => {
  const id = randomUUID()

  switch (purpose) {
    case "org-logo":
      return `${requestFilesPrefix(userId)}logo/${id}.${ext}`
    case "org-document":
      return `${requestFilesPrefix(userId)}documents/${id}.${ext}`
  }
}

const deleteObject = (key: string) =>
  s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))

/** Deletes the rejected upload so it doesn't wait for the tmp/ lifecycle rule. */
const rejectUpload = async (key: string, message: string, code: string) => {
  await deleteObject(key)
  throw new AppError(message, 400, code)
}

export const createUploadService = async (
  userId: string,
  input: CreateUploadInput
) => {
  assertSafeUserId(userId)

  const rule = UPLOAD_RULES[input.purpose]
  const ext = EXTENSION_BY_MIME[input.contentType]
  if (!ext || !rule.mimeTypes.includes(input.contentType)) {
    throw new AppError(
      "This file type is not allowed",
      400,
      "MEDIA.UNSUPPORTED_TYPE"
    )
  }

  if (input.sizeBytes > rule.maxBytes) {
    throw new AppError("This file is too large", 400, "MEDIA.FILE_TOO_LARGE")
  }

  // The server picks the key; the user's file name is never part of it.
  const key = `tmp/${userId}/${input.purpose}/${randomUUID()}.${ext}`

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      // Signed, so the browser must send exactly this Content-Type.
      ContentType: input.contentType,
    }),
    { expiresIn: env.S3_UPLOAD_URL_TTL_SECONDS }
  )
  return {
    key,
    url,
    method: "PUT",
    headers: { "Content-Type": input.contentType },
    expiresInSeconds: env.S3_UPLOAD_URL_TTL_SECONDS,
  }
}

/**
 * Re-checks the uploaded object's real size and type, since a presigned PUT
 * can't enforce either, then moves it out of tmp/ to its final key.
 */
export const completeUploadService = async (userId: string, key: string) => {
  assertSafeUserId(userId)

  const match = TMP_KEY.exec(key)
  const [, keyUserId, purpose] = match ?? []

  if (keyUserId !== userId || !purpose || !isUploadPurpose(purpose)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN")
  }

  const rule = UPLOAD_RULES[purpose]

  let sizeBytes: number
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
    )

    sizeBytes = head.ContentLength ?? 0
  } catch (error) {
    if (error instanceof NotFound) {
      throw new AppError(
        "Upload not found or expired",
        404,
        "MEDIA.UPLOAD_NOT_FOUND"
      )
    }
    throw error
  }

  if (sizeBytes === 0 || sizeBytes > rule.maxBytes) {
    return rejectUpload(key, "This file is too large", "MEDIA.FILE_TOO_LARGE")
  }

  // The type comes from the file's first bytes, not its name or the
  // Content-Type the browser sent.
  const start = await s3.send(
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Range: `bytes=0-${SNIFF_BYTES - 1}`,
    })
  )
  const bytes = await start.Body?.transformToByteArray()
  const sniffed = bytes ? await fileTypeFromBuffer(bytes) : undefined
  const contentType = sniffed
    ? (SNIFFED_MIME_ALIASES[sniffed.mime] ?? sniffed.mime)
    : undefined
  const ext = contentType ? EXTENSION_BY_MIME[contentType] : undefined

  if (!contentType || !ext || !rule.mimeTypes.includes(contentType)) {
    return rejectUpload(
      key,
      "This file type is not allowed",
      "MEDIA.UNSUPPORTED_TYPE"
    )
  }

  const objectKey = buildFinalKey(purpose, userId, ext)

  await s3.send(
    new CopyObjectCommand({
      Bucket: env.S3_BUCKET,
      CopySource: `${env.S3_BUCKET}/${key}`,
      Key: objectKey,
      MetadataDirective: "REPLACE",
      ContentType: contentType,
      CacheControl: "private, no-store",
    })
  )
  await deleteObject(key)

  return { objectKey, contentType, sizeBytes, purpose }
}

const signDownloadUrl = async (key: string, fileName?: string) => {
  // filename= takes ASCII only and must not break out of its quotes;
  // filename* carries the real (possibly non-English) name.
  const asciiName = fileName?.replace(/[^\x20-\x7e]|["\\]/g, "_")
  const contentDisposition = fileName
    ? `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    : undefined

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: contentDisposition,
    }),
    { expiresIn: env.S3_DOWNLOAD_URL_TTL_SECONDS }
  )

  return { url, expiresInSeconds: env.S3_DOWNLOAD_URL_TTL_SECONDS }
}

const assertPrivateKey = (key: string, prefix = "private/") => {
  if (!key.startsWith(prefix) || key.includes("..")) {
    throw new AppError("Forbidden", 403, "FORBIDDEN")
  }
}

/**
 * Signs a short-lived GET for the requester's own files. Reviewers and
 * organization members get theirs from organization-service, which knows who
 * may see what.
 */
export const getDownloadUrlService = async (
  userId: string,
  input: { key: string; fileName?: string }
) => {
  assertSafeUserId(userId)
  assertPrivateKey(input.key, requestFilesPrefix(userId))

  return signDownloadUrl(input.key, input.fileName)
}

/**
 * For organization-service, once it has checked the caller may see the file:
 * signs a GET for any private key.
 */
export const signInternalDownloadUrlService = async (input: {
  key: string
  fileName?: string
}) => {
  assertPrivateKey(input.key)

  return signDownloadUrl(input.key, input.fileName)
}

/**
 * For organization-service on approval: copies a request's file under the
 * organization. Only request files can be copied, and only to there.
 */
export const copyInternalFileService = async (input: {
  sourceKey: string
  targetKey: string
}) => {
  assertPrivateKey(input.sourceKey, "private/organization-requests/")
  assertPrivateKey(input.targetKey, "private/organizations/")

  await s3.send(
    new CopyObjectCommand({
      Bucket: env.S3_BUCKET,
      CopySource: `${env.S3_BUCKET}/${input.sourceKey}`,
      Key: input.targetKey,
    })
  )

  return { objectKey: input.targetKey }
}
````

### `services/media-service/tsconfig.json`

````json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "module": "preserve",
    "moduleResolution": "bundler",
    "rootDir": "./src",
    "outDir": "./dist",
    "resolveJsonModule": true,
    "types": [
      "node"
    ]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
````

## Shared packages

Schemas and types. `create-organization.ts` is the original; the form-only part of it is still in the repo.

### `packages/schemas/src/organization/create-organization.ts`

````ts
import {
  postcodeValidator,
  postcodeValidatorExistsForCountry,
} from "postcode-validator"
import { z } from "zod"

/**
 * Stored on OrganizationRequest.proposedIndustry. A fixed catalog kept in
 * code, like the permission modules; labels live in the admin app.
 */
export const ORGANIZATION_INDUSTRIES = [
  "FASHION_APPAREL",
  "RETAIL",
  "ECOMMERCE",
  "HEALTH_BEAUTY",
  "ELECTRONICS",
  "HOME_FURNITURE",
  "MANUFACTURING",
  "TECHNOLOGY",
  "LOGISTICS",
  "EDUCATION",
  "OTHER",
] as const

export type OrganizationIndustry = (typeof ORGANIZATION_INDUSTRIES)[number]

/** Stored on OrganizationRequest.proposedSize: headcount bands. */
export const ORGANIZATION_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001+",
] as const

export type OrganizationSize = (typeof ORGANIZATION_SIZES)[number]

export const ORGANIZATION_NAME_MAX_LENGTH = 100

export const ORGANIZATION_SLUG_MIN_LENGTH = 3
export const ORGANIZATION_SLUG_MAX_LENGTH = 50

export const ORGANIZATION_DESCRIPTION_MIN_LENGTH = 20
export const ORGANIZATION_DESCRIPTION_MAX_LENGTH = 1000

export const ORGANIZATION_LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
// No SVG: it can carry scripts, and media-service can't confirm its type
// from the file's bytes.
export const ORGANIZATION_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const

// Lowercase words joined by single hyphens, e.g. "acme-retail"; it becomes
// part of the organization's URL, so it can't start or end with a hyphen.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Tax IDs differ per country (GSTIN, VAT, EIN…); the backend checks the exact
// format. Here: letters, digits and common separators only.
const TAX_ID_PATTERN = /^[A-Z0-9][A-Z0-9 ./-]{3,29}$/i

export interface CreateOrganizationValidationMessages {
  organizationNameRequired: string
  organizationNameTooLong: string
  organizationSlugRequired: string
  organizationSlugMinLength: string
  organizationSlugTooLong: string
  organizationSlugPattern: string
  organizationLogoRequired: string
  organizationLogoTooLarge: string
  organizationLogoWrongFormat: string
  organizationSizeRequired: string
  organizationIndustryTypeRequired: string
  organizationCountryRequired: string
  organizationWebsiteInvalid: string
  organizationDescriptionRequired: string
  organizationDescriptionMinLength: string
  organizationDescriptionTooLong: string
  organizationTaxDetailsRequired: string
  organizationTaxDetailsInvalid: string
  addressLine1Required: string
  cityRequired: string
  stateRequired: string
  postalCodeRequired: string
  postalCodeInvalid: string
}

type Messages = Partial<CreateOrganizationValidationMessages>

/** Turns a name into a slug suggestion, e.g. "Acme Retail Ltd." → "acme-retail-ltd". */
export const toOrganizationSlug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ORGANIZATION_SLUG_MAX_LENGTH)
    .replace(/-+$/, "")

/**
 * The fields shared by the form and the request body, named as the columns of
 * OrganizationRequest they're stored in. Kept apart from the cross-field
 * checks below because Zod can't `.extend()` or `.omit()` a schema that has
 * refinements.
 */
const organizationObjectSchema = (messages: Messages) =>
  z.object({
    proposedName: z
      .string()
      .trim()
      .min(1, messages.organizationNameRequired)
      .max(ORGANIZATION_NAME_MAX_LENGTH, messages.organizationNameTooLong),
    // Uniqueness is checked by organization-service (409 when taken).
    proposedSlug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, messages.organizationSlugRequired)
      .min(ORGANIZATION_SLUG_MIN_LENGTH, messages.organizationSlugMinLength)
      .max(ORGANIZATION_SLUG_MAX_LENGTH, messages.organizationSlugTooLong)
      .regex(SLUG_PATTERN, messages.organizationSlugPattern),
    proposedDescription: z
      .string()
      .trim()
      .min(1, messages.organizationDescriptionRequired)
      .min(
        ORGANIZATION_DESCRIPTION_MIN_LENGTH,
        messages.organizationDescriptionMinLength
      )
      .max(
        ORGANIZATION_DESCRIPTION_MAX_LENGTH,
        messages.organizationDescriptionTooLong
      ),
    // ISO 3166-1 alpha-2, uppercase, as in GET /auth/countries. The address
    // and tax details are checked against it.
    proposedCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, messages.organizationCountryRequired),
    proposedIndustry: z.enum(
      ORGANIZATION_INDUSTRIES,
      messages.organizationIndustryTypeRequired
    ),
    proposedSize: z.enum(ORGANIZATION_SIZES, messages.organizationSizeRequired),
    // Optional; blank means none.
    proposedWebsite: z
      .union([
        z.literal(""),
        z.url({
          protocol: /^https?$/,
          hostname: z.regexes.domain,
          message: messages.organizationWebsiteInvalid,
        }),
      ])
      .optional(),
    // JSON column. Countries may add more fields; taxId is the one every
    // country has.
    proposedTaxDetails: z.object({
      taxId: z
        .string()
        .trim()
        .min(1, messages.organizationTaxDetailsRequired)
        .regex(TAX_ID_PATTERN, messages.organizationTaxDetailsInvalid),
    }),
    // JSON column.
    proposedAddress: z.object({
      addressLine1: z.string().trim().min(1, messages.addressLine1Required),
      addressLine2: z.string().trim().optional(),
      city: z.string().trim().min(1, messages.cityRequired),
      state: z.string().trim().min(1, messages.stateRequired),
      // Required only where the country uses postal codes; see below.
      postalCode: z.string().trim(),
    }),
  })

/**
 * The postal code must match the organization's country, e.g. 6 digits for
 * India, "SW1A 1AA" for the UK. Countries without postal codes (e.g. the
 * UAE) may leave it blank.
 */
const refineOrganization =
  (messages: Messages) =>
  (
    data: {
      proposedCountryCode: string
      proposedAddress: { postalCode: string }
    },
    ctx: z.RefinementCtx
  ) => {
    const country = data.proposedCountryCode
    const { postalCode } = data.proposedAddress

    if (!country || !postcodeValidatorExistsForCountry(country)) return

    if (!postalCode) {
      ctx.addIssue({
        code: "custom",
        path: ["proposedAddress", "postalCode"],
        message: messages.postalCodeRequired,
      })
    } else if (!postcodeValidator(postalCode, country)) {
      ctx.addIssue({
        code: "custom",
        path: ["proposedAddress", "postalCode"],
        message: messages.postalCodeInvalid,
      })
    }
  }

/**
 * The create-organization onboarding form. proposedLogo is the picked File;
 * it's uploaded on its own and the request body carries
 * proposedLogoObjectKey instead.
 */
export const createCreateOrganizationSchema = (messages: Messages = {}) =>
  organizationObjectSchema(messages)
    .extend({
      proposedLogo: z
        .instanceof(File, { message: messages.organizationLogoRequired })
        .refine(
          (file) =>
            (ORGANIZATION_LOGO_MIME_TYPES as readonly string[]).includes(
              file.type
            ),
          messages.organizationLogoWrongFormat
        )
        .refine(
          (file) => file.size <= ORGANIZATION_LOGO_MAX_SIZE_BYTES,
          messages.organizationLogoTooLarge
        ),
    })
    .superRefine(refineOrganization(messages))

export type CreateOrganizationFormValues = z.input<
  ReturnType<typeof createCreateOrganizationSchema>
>

/**
 * POST body for a CREATE OrganizationRequest. Services call it without
 * messages and get Zod's defaults.
 */
export const createOrganizationRequestSchema = (messages: Messages = {}) =>
  organizationObjectSchema(messages)
    .extend({
      // Private S3 key from media-service; organization-service checks it
      // belongs to the requester.
      proposedLogoObjectKey: z
        .string()
        .trim()
        .min(1, messages.organizationLogoRequired),
    })
    .superRefine(refineOrganization(messages))

export type CreateOrganizationRequestInput = z.output<
  ReturnType<typeof createOrganizationRequestSchema>
>
````

### `packages/schemas/src/organization/review-organization-request.ts`

````ts
import { z } from "zod"

export const ORGANIZATION_REQUEST_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
] as const

export const REVIEW_COMMENT_MAX_LENGTH = 1000

/** GET /organization/requests: the reviewer's queue, optionally by status. */
export const listOrganizationRequestsQuerySchema = z.object({
  status: z.enum(ORGANIZATION_REQUEST_STATUSES).optional(),
})

/** POST /organization/requests/:requestId/reject: the requester sees why. */
export const rejectOrganizationRequestSchema = z.object({
  reviewComment: z.string().trim().min(1).max(REVIEW_COMMENT_MAX_LENGTH),
})
````

### `packages/schemas/src/media/upload.ts`

````ts
import { z } from "zod"
import {
  ORGANIZATION_LOGO_MAX_SIZE_BYTES,
  ORGANIZATION_LOGO_MIME_TYPES,
} from "../organization/create-organization"

export const UPLOAD_PURPOSES = ["org-logo", "org-document"] as const

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number]

type UploadRule = {
  mimeTypes: readonly string[]
  maxBytes: number
}

/**
 * Checked by the admin app for instant feedback and by media-service, whose
 * check is the one that counts. Every file is private and read only through
 * short-lived signed URLs.
 */
export const UPLOAD_RULES: Record<UploadPurpose, UploadRule> = {
  "org-logo": {
    mimeTypes: ORGANIZATION_LOGO_MIME_TYPES,
    maxBytes: ORGANIZATION_LOGO_MAX_SIZE_BYTES,
  },
  "org-document": {
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
    maxBytes: 10 * 1024 * 1024,
  },
}

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/msword": "doc",
}

export const FILE_NAME_MAX_LENGTH = 255

export const createUploadSchema = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  fileName: z.string().trim().min(1).max(FILE_NAME_MAX_LENGTH),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

export type CreateUploadInput = z.infer<typeof createUploadSchema>

export const completeUploadSchema = z.object({
  key: z.string().min(1).max(1024),
})

export const downloadUrlSchema = z.object({
  key: z.string().min(1).max(1024),
  fileName: z.string().trim().min(1).max(FILE_NAME_MAX_LENGTH).optional(),
})

/** Internal: organization-service copying an approved request's file. */
export const copyFileSchema = z.object({
  sourceKey: z.string().min(1).max(1024),
  targetKey: z.string().min(1).max(1024),
})
````

### `packages/shared/src/types/organization.ts`

````ts
// `data` of organization-service responses, as they arrive over JSON:
// timestamps are ISO 8601 strings.

/** GET /organization/status */
export interface OrganizationStatusResponseData {
  userId: string
  pendingEvents: number
}

export type OrganizationRequestType = "JOIN" | "CREATE"

export type OrganizationRequestStatus =
  "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN"

export type OrganizationStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED"

export interface OrganizationRequest {
  id: string
  userId: string
  organizationId: string | null
  type: OrganizationRequestType
  organizationRequestStatus: OrganizationRequestStatus
  proposedName: string | null
  proposedSlug: string | null
  proposedDescription: string | null
  proposedCountryCode: string
  proposedIndustry: string | null
  proposedSize: string | null
  proposedWebsite: string | null
  /** Private S3 key; GET .../logo-url signs a link for allowed users. */
  proposedLogoObjectKey: string | null
  proposedTaxDetails: { taxId: string } | null
  proposedAddress: {
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
  } | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  reviewComment: string | null
  submittedAt: string
  updatedAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  countryCode: string
  status: OrganizationStatus
  createdByUserId: string
  logoObjectKey: string | null
  createdAt: string
  updatedAt: string
}

/** POST /organization/requests, GET /organization/requests/:requestId */
export interface OrganizationRequestResponseData {
  request: OrganizationRequest
}

/** GET /organization/requests/me: null before the first submit. */
export interface MyOrganizationRequestResponseData {
  request: OrganizationRequest | null
}

/** GET /organization/requests: the reviewer's queue. */
export interface OrganizationRequestListResponseData {
  requests: OrganizationRequest[]
}

/** POST /organization/requests/:requestId/approve */
export interface ApproveOrganizationRequestResponseData {
  request: OrganizationRequest
  organization: Organization
}

/** GET .../logo-url: a short-lived signed link to the private logo. */
export interface FileUrlResponseData {
  url: string
  expiresInSeconds: number
}
````

### `packages/shared/src/types/media.ts`

````ts
// `data` of media-service responses.

export interface CreateUploadResponseData {
  key: string
  /** Presigned S3 URL the browser sends the file to, valid for `expiresInSeconds`. */
  url: string
  method: "PUT"
  /** Signed into `url`; the upload must send exactly these. */
  headers: Record<string, string>
  expiresInSeconds: number
}

export interface CompleteUploadResponseData {
  /** Final S3 key, to store on the record the file belongs to. */
  objectKey: string
  contentType: string
  sizeBytes: number
  purpose: string
}

export interface DownloadUrlResponseData {
  url: string
  expiresInSeconds: number
}
````

## Admin app: API clients

Removed files.

### `apps/admin/lib/api/organization/create-organization.ts`

````ts
"use server"

import type { CreateOrganizationRequestInput } from "@nexora/schemas/organization/create-organization"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { OrganizationRequestResponseData } from "@nexora/shared/types/organization"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** Submits the CREATE request; sending it again replaces a PENDING one. */
export async function createOrganization(
  values: CreateOrganizationRequestInput
): Promise<ApiResult<OrganizationRequestResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<OrganizationRequestResponseData>>(
      "/organization/requests",
      values,
      { cache: "no-store" }
    )
  )
}
````

### `apps/admin/lib/api/organization/my-organization-request-get.ts`

````ts
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { MyOrganizationRequestResponseData } from "@nexora/shared/types/organization"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** The signed-in user's latest CREATE request; `request` is null before the first submit. */
export async function getMyOrganizationRequest(): Promise<
  ApiResult<MyOrganizationRequestResponseData>
> {
  return toApiResult(
    api.get<ApiSuccessResponse<MyOrganizationRequestResponseData>>(
      "/organization/requests/me",
      { cache: "no-store" }
    )
  )
}
````

### `apps/admin/lib/api/organization/request-logo-url-get.ts`

````ts
"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { FileUrlResponseData } from "@nexora/shared/types/organization"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/**
 * A short-lived signed link to the request's private logo. Asked for when
 * it's shown rather than with the page, so it hasn't expired by then.
 */
export async function getOrganizationRequestLogoUrl(
  requestId: string
): Promise<ApiResult<FileUrlResponseData>> {
  return toApiResult(
    api.get<ApiSuccessResponse<FileUrlResponseData>>(
      `/organization/requests/${encodeURIComponent(requestId)}/logo-url`,
      { cache: "no-store" }
    )
  )
}
````

### `apps/admin/lib/api/media/create-upload.ts`

````ts
"use server"

import type { CreateUploadInput } from "@nexora/schemas/media/upload"
import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { CreateUploadResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** A presigned URL the browser uploads one file to, straight to S3. */
export async function createUpload(
  values: CreateUploadInput
): Promise<ApiResult<CreateUploadResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<CreateUploadResponseData>>(
      "/media/uploads",
      values,
      { cache: "no-store" }
    )
  )
}
````

### `apps/admin/lib/api/media/complete-upload.ts`

````ts
"use server"

import type { ApiSuccessResponse } from "@nexora/shared/types/api"
import type { CompleteUploadResponseData } from "@nexora/shared/types/media"
import { toApiResult, type ApiResult } from "../result"
import { api } from "../server"

/** Has media-service check the uploaded file and move it to its final key. */
export async function completeUpload(
  key: string
): Promise<ApiResult<CompleteUploadResponseData>> {
  return toApiResult(
    api.post<ApiSuccessResponse<CompleteUploadResponseData>>(
      "/media/uploads/complete",
      { key },
      { cache: "no-store" }
    )
  )
}
````

### `apps/admin/lib/api/media/upload-file.ts`

````ts
import type { UploadPurpose } from "@nexora/schemas/media/upload"
import type { CompleteUploadResponseData } from "@nexora/shared/types/media"
import type { ApiResult } from "../result"
import { completeUpload } from "./complete-upload"
import { createUpload } from "./create-upload"

/**
 * Uploads `file` from the browser: a server action signs the upload, the
 * bytes go straight to S3, and a second action confirms it. Only metadata
 * passes through Next.js and the gateway.
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose
): Promise<ApiResult<CompleteUploadResponseData>> {
  const upload = await createUpload({
    purpose,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
  })

  if (!upload.success) return upload

  const { url, method, headers } = upload.data

  try {
    // No credentials: the signature in the URL is the only permission needed.
    const response = await fetch(url, { method, headers, body: file })
    if (!response.ok) {
      return {
        success: false,
        code: "MEDIA.UPLOAD_FAILED",
        status: response.status,
      }
    }
  } catch {
    return { success: false, code: "MEDIA.UPLOAD_FAILED" }
  }
  console.log('upload complete, calling completeUpload with key:', upload)
  return completeUpload(upload.data.key)
}
````

## Admin app: files changed

Originals of files that are still in the repo but had the organization and upload code taken out.

### `apps/admin/features/onboarding/create-organization/create-organization-form.tsx`

````tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  toOrganizationSlug,
  type CreateOrganizationFormValues,
} from "@nexora/schemas/organization/create-organization"
import type { Country } from "@nexora/shared/types/country"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import {
  createCreateOrganizationFormSchema,
  createOrganizationFormConfig,
} from "./create-organization-form-config"
import { EntityForm } from "@/components/forms/entity-form"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { uploadFile } from "@/lib/api/media/upload-file"
import { createOrganization } from "@/lib/api/organization/create-organization"
import { useApiToast } from "@/hooks/use-api-toast"
import { href } from "@/lib/i18n/config"
import {
  ONBOARDING_PATHS,
  ROLE_REQUIREMENTS_PATHS,
} from "@/lib/bootstrap/bootstrap-path"

interface CreateOrganizationFormProps {
  countries: Country[]
}

const CreateOrganizationForm = ({ countries }: CreateOrganizationFormProps) => {
  const t = useTranslations("onboarding")
  const tActions = useTranslations("common.actions")
  const { user } = useBootstrap()
  const { country: urlCountry, lang } = useParams<{
    country: string
    lang: string
  }>()
  const showApiToast = useApiToast()
  const router = useRouter()

  const schema = useMemo(() => createCreateOrganizationFormSchema(t), [t])

  // The organization starts in the user's own country, else the URL's.
  const savedCode = user?.bioCountry?.toUpperCase()
  const initialCountry =
    countries.find(({ code }) => code === savedCode) ??
    countries.find(({ code }) => code === urlCountry.toUpperCase())

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(schema),
    // Keys are OrganizationRequest's columns, so the request body and server
    // field errors map onto the form one to one.
    defaultValues: {
      proposedName: "",
      proposedSlug: toOrganizationSlug(""),
      proposedDescription: "",
      proposedCountryCode: initialCountry?.code ?? "",
      proposedIndustry: undefined,
      proposedSize: undefined,
      proposedWebsite: "",
      proposedTaxDetails: { taxId: "" },
      proposedAddress: {
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
      },
      proposedLogo: undefined,
    },
  })

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  )

  const createOrganizationConfig = createOrganizationFormConfig({
    t,
    countries,
    selectedCountryCode: initialCountry?.code,
    lang,
    regionNames,
  })

  const applyServerFieldErrors = useServerFieldErrors(form)

  const handlePreviousStep = async () => {
    const stepResult = await updateOnboardingStep({
      step: "CHOOSE_PATH",
    })
    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }
    router.replace(href(urlCountry, lang, ONBOARDING_PATHS.BASIC_INFORMATION))
  }

  const handleSubmit = async (values: CreateOrganizationFormValues) => {
    // Parsed again for the schema's output type: trimmed, enums narrowed.
    const { proposedLogo, ...organization } = schema.parse(values)
    // The logo goes to S3 first (privately); the request only carries its key.
    const logoResult = await uploadFile(proposedLogo, "org-logo")
    if (!logoResult.success) {
      showApiToast(logoResult)
      return
    }

    const createOrganizationData = {
      ...organization,
      proposedLogoObjectKey: logoResult.data.objectKey,
    }

    const result = await createOrganization(createOrganizationData)
    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    const stepResult = await updateOnboardingStep({
      step: "REVIEW",
    })

    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }

    router.replace(href(urlCountry, lang, ONBOARDING_PATHS.REVIEW))
  }

  return (
    <div>
      <EntityForm
        form={form}
        config={createOrganizationConfig}
        onSubmit={handleSubmit}
        actions={[
          {
            key: "previous",
            label: tActions("previous"),
            variant: "outline",
            onClick: () => handlePreviousStep(),
          },
          {
            key: "next",
            label: tActions("next"),
            type: "submit",
            loading: form.formState.isSubmitting,
          },
        ]}
      />
    </div>
  )
}

export default CreateOrganizationForm
````

### `apps/admin/app/[country]/[lang]/onboarding/review/page.tsx`

````tsx
import OnboardingReview from "@/features/onboarding/review/onboarding-review"
import { onboardingMetadata } from "@/features/onboarding/onboarding-metadata"
import { OnboardingPageGuard } from "@/features/onboarding/onboarding-page-guard"
import { bootstrap } from "@/lib/api/bootstrap/helpers/bootstrap"
import { getBecomeAdminFormDetails } from "@/lib/api/onboarding/become-admin-get"
import { getMyOrganizationRequest } from "@/lib/api/organization/my-organization-request-get"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

interface ReviewPageProps {
  params: Promise<LocaleParams>
}

export const generateMetadata = ({ params }: ReviewPageProps) =>
  onboardingMetadata(params, "review")

// BECOME_ADMIN and CREATE_ORGANIZATION save a request of their own; the
// other paths show what the onboarding record holds. bootstrap() is cached
// per request, so this shares the guard's fetch.
const OnboardingReviewWithRequest = async ({
  params,
}: {
  params: Promise<LocaleParams>
}) => {
  const { country, lang } = await resolveLocaleParams(params)
  const { onboarding } = await bootstrap(country, lang)

  if (onboarding?.selectedPath === "BECOME_ADMIN") {
    const result = await getBecomeAdminFormDetails()

    if (!result.success) {
      throw new Error(`Failed to load become admin request: ${result.code}`)
    }

    return (
      <OnboardingReview adminAccessRequest={result.data.adminAccessRequest} />
    )
  }

  if (onboarding?.selectedPath === "CREATE_ORGANIZATION") {
    const result = await getMyOrganizationRequest()

    if (!result.success) {
      throw new Error(`Failed to load organization request: ${result.code}`)
    }

    return <OnboardingReview organizationRequest={result.data.request} />
  }

  return <OnboardingReview />
}

const ReviewPage = ({ params }: ReviewPageProps) => (
  <OnboardingPageGuard params={params} page="review">
    <OnboardingReviewWithRequest params={params} />
  </OnboardingPageGuard>
)

export default ReviewPage
````

### `apps/admin/features/onboarding/review/onboarding-review.tsx`

````tsx
"use client"

import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import type { AdminAccessRequest } from "@nexora/shared/types/onboarding"
import type { OrganizationRequest } from "@nexora/shared/types/organization"
import { Banner } from "@nexora/ui/components/banner"
import { Button } from "@nexora/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { cn } from "@nexora/ui/lib/utils"
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  FileCheck,
  FileClock,
  FileText,
  FileX,
  Hash,
  type LucideIcon,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useId, useState, type ReactNode } from "react"
import {
  PATH_KEYS,
  reviewOutcome,
  reviewStageState,
  reviewStages,
  type ReviewOutcome,
  type ReviewStageState,
} from "./review-status"
import SubmittedInformation from "./submitted-information"

const OUTCOME_ICONS: Record<
  ReviewOutcome,
  { file: LucideIcon; title: LucideIcon }
> = {
  waiting: { file: FileClock, title: CircleCheck },
  inReview: { file: FileClock, title: CircleCheck },
  approved: { file: FileCheck, title: CircleCheck },
  rejected: { file: FileX, title: CircleX },
}

// waiting and inReview share the "submitted" hero; only the badge differs.
const HERO_KEYS = {
  waiting: "submitted",
  inReview: "submitted",
  approved: "approved",
  rejected: "rejected",
} as const satisfies Record<ReviewOutcome, string>

const STATUS_BADGE_CLASSES: Record<ReviewOutcome, string> = {
  waiting: "bg-warning/10 text-warning",
  inReview: "bg-info/10 text-info",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

const STAGE_ICONS = {
  submitted: Check,
  inReview: Clock,
  underApproval: UserRound,
  completed: Check,
} as const satisfies Record<(typeof reviewStages)[number], LucideIcon>

const STAGE_INDICATOR_CLASSES: Record<ReviewStageState, string> = {
  done: "bg-primary text-primary-foreground",
  current: "bg-primary/10 text-primary ring-2 ring-primary/30",
  pending: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/10 text-destructive ring-2 ring-destructive/30",
}

const STAGE_CAPTION_CLASSES: Record<ReviewStageState, string> = {
  done: "text-primary",
  current: "text-primary",
  pending: "text-muted-foreground",
  rejected: "text-destructive",
}

const DetailRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="flex items-center gap-3 text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </dt>
    <dd className="min-w-0 truncate text-end font-medium">{children}</dd>
  </div>
)

const NextStep = ({
  icon: Icon,
  iconClassName,
  title,
  description,
}: {
  icon: LucideIcon
  iconClassName: string
  title: string
  description: string
}) => (
  <li className="flex gap-4">
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        iconClassName
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
    <div className="flex flex-col gap-1">
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </li>
)

interface OnboardingReviewProps {
  /** The BECOME_ADMIN path's request; left out on the other paths. */
  adminAccessRequest?: AdminAccessRequest | null
  /** The CREATE_ORGANIZATION path's request; left out on the other paths. */
  organizationRequest?: OrganizationRequest | null
}

const OnboardingReview = ({
  adminAccessRequest = null,
  organizationRequest = null,
}: OnboardingReviewProps) => {
  const t = useTranslations("onboarding")
  const format = useFormatter()
  const { account, onboarding } = useBootstrap()
  const [showSubmitted, setShowSubmitted] = useState(false)
  const submittedId = useId()

  // Whichever request the path saved, with its status under one name.
  const request =
    adminAccessRequest ??
    (organizationRequest && {
      ...organizationRequest,
      status: organizationRequest.organizationRequestStatus,
    })

  const outcome = reviewOutcome(onboarding, request?.status ?? null)
  const heroKey = HERO_KEYS[outcome]
  const { file: FileIcon, title: TitleIcon } = OUTCOME_ICONS[outcome]

  const submittedAt = request?.submittedAt ?? onboarding?.submittedAt ?? null
  const formatDateTime = (value: string) =>
    format.dateTime(new Date(value), {
      dateStyle: "medium",
      timeStyle: "short",
    })

  const rejectionReason =
    request?.reviewComment ?? onboarding?.rejectionReason ?? null

  const isRejected = outcome === "rejected"

  return (
    <div className="flex flex-col gap-6">
      {/* Status */}
      <Card className="gap-8 py-8">
        <CardContent className="flex flex-col items-center gap-8 px-4 text-center sm:px-8">
          <div className="flex flex-col items-center gap-5">
            <span
              className={cn(
                "flex size-24 items-center justify-center rounded-full",
                isRejected
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              )}
            >
              <FileIcon className="size-11" aria-hidden="true" />
            </span>
            <div className="flex flex-col items-center gap-2">
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <TitleIcon
                  className={cn(
                    "size-7 shrink-0",
                    isRejected ? "text-destructive" : "text-success"
                  )}
                  aria-hidden="true"
                />
                {t(`review.hero.${heroKey}.title`)}
              </h1>
              <p
                className={cn(
                  "text-xl font-semibold",
                  isRejected ? "text-destructive" : "text-primary"
                )}
              >
                {t(`review.hero.${heroKey}.subtitle`)}
              </p>
            </div>
            <p className="max-w-lg text-muted-foreground">
              {t(`review.hero.${heroKey}.description`)}
            </p>
          </div>

          {/* Progress */}
          <ol className="grid w-full grid-cols-2 gap-y-6 sm:grid-cols-4">
            {reviewStages.map((stage, index) => {
              const state = reviewStageState(outcome, index)
              const Icon = state === "rejected" ? X : STAGE_ICONS[stage]
              const caption =
                stage === "submitted" && submittedAt
                  ? formatDateTime(submittedAt)
                  : t(`review.stageStates.${state}`)

              return (
                <li
                  key={stage}
                  className="relative flex flex-col items-center gap-2"
                  aria-current={
                    state === "current" || state === "rejected"
                      ? "step"
                      : undefined
                  }
                >
                  {index < reviewStages.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-5 left-[calc(50%+1.75rem)] hidden h-px w-[calc(100%-3.5rem)] border-t border-dashed sm:block rtl:right-[calc(50%+1.75rem)] rtl:left-auto",
                        state === "done" ? "border-primary" : "border-border"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      STAGE_INDICATOR_CLASSES[state]
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-medium">
                    {t(`review.stages.${stage}`)}
                  </span>
                  <span className={cn("text-xs", STAGE_CAPTION_CLASSES[state])}>
                    {caption}
                  </span>
                </li>
              )
            })}
          </ol>

          {isRejected ? (
            rejectionReason && (
              <Banner variant="destructive" className="text-start">
                <p className="font-medium">{t("review.rejectionReason")}</p>
                <p className="text-foreground/80">{rejectionReason}</p>
              </Banner>
            )
          ) : (
            <Banner variant="info" className="justify-center">
              {t("review.turnaround")}
            </Banner>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">
              {t("review.details.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="divide-y">
              <DetailRow icon={Hash} label={t("review.details.requestId")}>
                <span
                  className="font-mono text-xs"
                  title={request?.id ?? onboarding?.id}
                >
                  {request?.id ?? onboarding?.id ?? "—"}
                </span>
              </DetailRow>
              <DetailRow
                icon={CalendarDays}
                label={t("review.details.submittedOn")}
              >
                {submittedAt ? formatDateTime(submittedAt) : "—"}
              </DetailRow>
              <DetailRow
                icon={ClipboardList}
                label={t("review.details.requestType")}
              >
                {onboarding?.selectedPath
                  ? t(
                      `chooseYourPathForm.paths.${PATH_KEYS[onboarding.selectedPath]}.label`
                    )
                  : "—"}
              </DetailRow>
              <DetailRow
                icon={UserRound}
                label={t("review.details.submittedBy")}
              >
                {t("review.details.you", {
                  name: `${account.firstName} ${account.lastName}`,
                })}
              </DetailRow>
              <DetailRow
                icon={Activity}
                label={t("review.details.currentStatus")}
              >
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    STATUS_BADGE_CLASSES[outcome]
                  )}
                >
                  {t(`review.statuses.${outcome}`)}
                </span>
              </DetailRow>
            </dl>
            <Button
              variant="outline"
              className="self-center"
              aria-expanded={showSubmitted}
              size="sm"
              aria-controls={submittedId}
              onClick={() => setShowSubmitted((shown) => !shown)}
            >
              <FileText aria-hidden="true" />
              {showSubmitted
                ? t("review.hideSubmitted")
                : t("review.viewSubmitted")}
            </Button>
          </CardContent>
        </Card>

        {/* What happens next */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold">
              {t("review.next.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-6">
              <NextStep
                icon={Clock}
                iconClassName="bg-primary/10 text-primary"
                title={t("review.next.review.title")}
                description={t("review.next.review.description")}
              />
              <NextStep
                icon={Bell}
                iconClassName="bg-warning/10 text-warning"
                title={t("review.next.notified.title")}
                description={t("review.next.notified.description")}
              />
              <NextStep
                icon={UserRoundCheck}
                iconClassName="bg-success/10 text-success"
                title={t("review.next.activation.title")}
                description={t("review.next.activation.description")}
              />
            </ul>
          </CardContent>
        </Card>
      </div>

      <div id={submittedId} hidden={!showSubmitted}>
        {showSubmitted && (
          <SubmittedInformation
            adminAccessRequest={adminAccessRequest}
            organizationRequest={organizationRequest}
          />
        )}
      </div>

      <p className="text-center text-muted-foreground">{t("review.thanks")}</p>
    </div>
  )
}

export default OnboardingReview
````

### `apps/admin/features/onboarding/review/submitted-information.tsx`

````tsx
"use client"

import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import {
  ACTION_KEYS,
  MODULE_ICONS,
  MODULE_KEYS,
} from "@/features/onboarding/become-admin/become-admin-form-config"
import { INDUSTRY_KEYS } from "@/features/onboarding/create-organization/create-organization-form-config"
import { getOrganizationRequestLogoUrl } from "@/lib/api/organization/request-logo-url-get"
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import type { OrganizationIndustry } from "@nexora/schemas/organization/create-organization"
import type { AdminAccessRequest } from "@nexora/shared/types/onboarding"
import type { OrganizationRequest } from "@nexora/shared/types/organization"
import type { Gender } from "@nexora/shared/types/user"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { useFormatter, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { ImageOff } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import Image from "next/image"

// Labels live in onboarding.json under chooseYourPathForm.genderOptions.
const GENDER_KEYS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "preferNotToSay",
} as const satisfies Record<Gender, string>

/**
 * A request's permission rows grouped as { [country]: { [module]: action[] } },
 * with modules and actions in the order the form shows them.
 */
const groupPermissions = (request: AdminAccessRequest) => {
  const byCountry = new Map<
    string,
    Map<PermissionModuleCode, Set<PermissionAction>>
  >()

  for (const {
    countryCode,
    moduleCode,
    accessLevel,
  } of request.requestedPermissions) {
    const modules = byCountry.get(countryCode) ?? new Map()
    byCountry.set(countryCode, modules)
    const actions = modules.get(moduleCode as PermissionModuleCode) ?? new Set()
    modules.set(moduleCode as PermissionModuleCode, actions)
    actions.add(accessLevel as PermissionAction)
  }

  return [...byCountry].map(([countryCode, modules]) => ({
    countryCode,
    modules: PERMISSION_MODULES.filter((code) => modules.has(code)).map(
      (code) => ({
        code,
        actions: PERMISSION_ACTIONS.filter((action) =>
          modules.get(code)?.has(action)
        ),
      })
    ),
  }))
}

const Section = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="flex flex-col gap-3">
    <h3 className="font-semibold">{title}</h3>
    {children}
  </section>
)

/** Hides fields the user left empty, e.g. address line 2. */
const Fields = ({
  fields,
}: {
  fields: { label: string; value: ReactNode | null | undefined }[]
}) => (
  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
    {fields
      .filter(
        ({ value }) => value !== null && value !== undefined && value !== ""
      )
      .map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium wrap-break-word">{value}</dd>
        </div>
      ))}
  </dl>
)

/**
 * The request's private logo. Its signed link lasts minutes, so it's asked
 * for when this is shown, not with the page.
 */
const RequestLogo = ({
  requestId,
  alt,
}: {
  requestId: string
  alt: string
}) => {
  const t = useTranslations("onboarding")
  const [logo, setLogo] = useState<{ url: string } | "failed" | null>(null)

  useEffect(() => {
    let cancelled = false
    getOrganizationRequestLogoUrl(requestId).then((result) => {
      if (!cancelled)
        setLogo(result.success ? { url: result.data.url } : "failed")
    })
    return () => {
      cancelled = true
    }
  }, [requestId])

  return (
    <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden bg-muted/30">
      {logo === null && (
        <span className="size-full animate-pulse bg-muted" aria-hidden="true" />
      )}
      {logo === "failed" && (
        <ImageOff
          className="size-6 text-muted-foreground"
          aria-label={t("review.submittedInformation.logoUnavailable")}
        />
      )}
      {logo !== null && logo !== "failed" && (
        // unoptimized: the browser loads the signed link itself. The
        // optimizer would cache the private file past the link's expiry.
        <Image
          src={logo.url}
          alt={alt}
          className="object-contain"
          onError={() => setLogo("failed")}
          fill
          unoptimized
        />
      )}
    </div>
  )
}

interface SubmittedInformationProps {
  adminAccessRequest: AdminAccessRequest | null
  organizationRequest: OrganizationRequest | null
}

const SubmittedInformation = ({
  adminAccessRequest,
  organizationRequest,
}: SubmittedInformationProps) => {
  const t = useTranslations("onboarding")
  const format = useFormatter()
  const { account, user } = useBootstrap()
  const { lang } = useParams<{ lang: string }>()

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  )
  const languageNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "language" }),
    [lang]
  )

  const fields = "chooseYourPathForm.fields" as const
  const adminFields = "becomeAdminForm.fields" as const
  const orgFields = "createOrganizationForm.fields" as const
  const orgSections = "createOrganizationForm.sections" as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-semibold">
          {t("review.submittedInformation.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <Section title={t("review.submittedInformation.personal")}>
          <Fields
            fields={[
              {
                label: t("review.submittedInformation.name"),
                value: `${account.firstName} ${account.lastName}`,
              },
              {
                label: t("review.submittedInformation.email"),
                value: account.email,
              },
              { label: t(`${fields}.phoneNumber`), value: user?.phoneNumber },
              {
                label: t(`${fields}.dob`),
                // A calendar date; formatting it in the viewer's zone could
                // move it a day.
                value:
                  user?.dob &&
                  format.dateTime(new Date(user.dob), {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }),
              },
              {
                label: t(`${fields}.gender`),
                value:
                  user?.gender &&
                  t(
                    `chooseYourPathForm.genderOptions.${GENDER_KEYS[user.gender]}`
                  ),
              },
              {
                label: t(`${fields}.bioCountry`),
                value: user?.bioCountry && regionNames.of(user.bioCountry),
              },
              { label: t(`${fields}.addressLine1`), value: user?.addressLine1 },
              { label: t(`${fields}.addressLine2`), value: user?.addressLine2 },
              { label: t(`${fields}.city`), value: user?.city },
              { label: t(`${fields}.state`), value: user?.state },
              { label: t(`${fields}.postalCode`), value: user?.postalCode },
              {
                label: t(`${fields}.languageCode`),
                value:
                  user?.languageCode && languageNames.of(user.languageCode),
              },
              { label: t(`${fields}.timezone`), value: user?.timezone },
            ]}
          />
          {user?.bio && (
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground">{t(`${fields}.bio`)}</p>
              <p className="whitespace-pre-line">{user.bio}</p>
            </div>
          )}
        </Section>

        {adminAccessRequest && (
          <>
            <Section title={t("becomeAdminForm.sections.role.title")}>
              <Fields
                fields={[
                  {
                    label: t(`${adminFields}.jobTitle`),
                    value: adminAccessRequest.jobTitle,
                  },
                  {
                    label: t(`${adminFields}.department`),
                    value: adminAccessRequest.department,
                  },
                  {
                    label: t(`${adminFields}.currentOrganizationName`),
                    value: adminAccessRequest.currentOrganizationName,
                  },
                ]}
              />
            </Section>

            <Section title={t("becomeAdminForm.sections.justification.title")}>
              <p className="whitespace-pre-line">
                {adminAccessRequest.justification}
              </p>
            </Section>

            <Section title={t("review.submittedInformation.permissions")}>
              <div className="flex flex-col gap-4">
                {groupPermissions(adminAccessRequest).map(
                  ({ countryCode, modules }) => (
                    <div
                      key={countryCode}
                      className="flex flex-col gap-3 rounded-lg border p-4"
                    >
                      <p className="font-medium">
                        {regionNames.of(countryCode) ?? countryCode}
                      </p>
                      <ul className="flex flex-col gap-3">
                        {modules.map(({ code, actions }) => {
                          const Icon = MODULE_ICONS[code]
                          return (
                            <li
                              key={code}
                              className="flex flex-wrap items-center justify-between gap-2"
                            >
                              <span className="flex items-center gap-2">
                                <Icon
                                  className="size-4 text-muted-foreground"
                                  aria-hidden="true"
                                />
                                {t(
                                  `becomeAdminForm.modules.${MODULE_KEYS[code]}.label`
                                )}
                              </span>
                              <span className="flex flex-wrap gap-1.5">
                                {actions.map((action) => (
                                  <span
                                    key={action}
                                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                                  >
                                    {t(
                                      `becomeAdminForm.actions.${ACTION_KEYS[action]}`
                                    )}
                                  </span>
                                ))}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </Section>
          </>
        )}
        {organizationRequest && (
          <>
            <Section title={t(`${orgSections}.details.title`)}>
              <div className="flex flex-col gap-6 sm:flex-row">
                {organizationRequest.proposedLogoObjectKey && (
                  <div className="flex flex-col gap-2">
                    <p className="text-muted-foreground">
                      {t(`${orgFields}.logo`)}
                    </p>
                    <RequestLogo
                      requestId={organizationRequest.id}
                      alt={t("review.submittedInformation.logoAlt", {
                        name: organizationRequest.proposedName ?? "",
                      })}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Fields
                    fields={[
                      {
                        label: t(`${orgFields}.name`),
                        value: organizationRequest.proposedName,
                      },
                      {
                        label: t(`${orgFields}.slug`),
                        value: organizationRequest.proposedSlug,
                      },
                      {
                        label: t(`${orgFields}.industry`),
                        value:
                          organizationRequest.proposedIndustry &&
                          organizationRequest.proposedIndustry in INDUSTRY_KEYS
                            ? t(
                                `createOrganizationForm.industries.${INDUSTRY_KEYS[organizationRequest.proposedIndustry as OrganizationIndustry]}`
                              )
                            : organizationRequest.proposedIndustry,
                      },
                      {
                        label: t(`${orgFields}.size`),
                        value:
                          organizationRequest.proposedSize &&
                          t("createOrganizationForm.sizeOption", {
                            range: organizationRequest.proposedSize.replace(
                              "-",
                              "–"
                            ),
                          }),
                      },
                      {
                        label: t(`${orgFields}.website`),
                        value: organizationRequest.proposedWebsite && (
                          <a
                            href={organizationRequest.proposedWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {organizationRequest.proposedWebsite}
                          </a>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
              {organizationRequest.proposedDescription && (
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground">
                    {t(`${orgFields}.description`)}
                  </p>
                  <p className="whitespace-pre-line">
                    {organizationRequest.proposedDescription}
                  </p>
                </div>
              )}
            </Section>

            <Section title={t(`${orgSections}.location.title`)}>
              <Fields
                fields={[
                  {
                    label: t(`${fields}.bioCountry`),
                    value:
                      regionNames.of(organizationRequest.proposedCountryCode) ??
                      organizationRequest.proposedCountryCode,
                  },
                  {
                    label: t(`${orgFields}.taxId`),
                    value: organizationRequest.proposedTaxDetails?.taxId,
                  },
                  {
                    label: t(`${fields}.addressLine1`),
                    value: organizationRequest.proposedAddress?.addressLine1,
                  },
                  {
                    label: t(`${fields}.addressLine2`),
                    value: organizationRequest.proposedAddress?.addressLine2,
                  },
                  {
                    label: t(`${fields}.city`),
                    value: organizationRequest.proposedAddress?.city,
                  },
                  {
                    label: t(`${fields}.state`),
                    value: organizationRequest.proposedAddress?.state,
                  },
                  {
                    label: t(`${fields}.postalCode`),
                    value: organizationRequest.proposedAddress?.postalCode,
                  },
                ]}
              />
            </Section>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SubmittedInformation
````

### `apps/admin/features/onboarding/review/review-status.ts`

````ts
import type {
  AdminAccessRequestStatus,
  Onboarding,
  OnboardingPath,
} from "@nexora/shared/types/onboarding"
import type { OrganizationRequestStatus } from "@nexora/shared/types/organization"

export type ReviewOutcome = "waiting" | "inReview" | "approved" | "rejected"

export type ReviewStage =
  "submitted" | "inReview" | "underApproval" | "completed"

export type ReviewStageState = "done" | "current" | "pending" | "rejected"

export const reviewStages = [
  "submitted",
  "inReview",
  "underApproval",
  "completed",
] as const satisfies readonly ReviewStage[]

// Labels live in onboarding.json under chooseYourPathForm.paths.
export const PATH_KEYS = {
  BECOME_ADMIN: "becomeAdmin",
  CREATE_ORGANIZATION: "createOrganization",
  JOIN_ORGANIZATION: "joinOrganization",
} as const satisfies Record<OnboardingPath, string>

/**
 * Where the submission stands. A rejection on either record wins; otherwise
 * the path's request, when it has one, says how far the review has got.
 */
export const reviewOutcome = (
  onboarding: Onboarding | null,
  requestStatus: AdminAccessRequestStatus | OrganizationRequestStatus | null
): ReviewOutcome => {
  if (onboarding?.status === "REJECTED" || requestStatus === "REJECTED") {
    return "rejected"
  }
  if (requestStatus === "APPROVED") return "approved"
  if (requestStatus === "UNDER_REVIEW") return "inReview"
  return "waiting"
}

/** The stage each outcome is on; the ones before it are done. */
const currentStageIndex: Record<ReviewOutcome, number> = {
  waiting: 1,
  inReview: 2,
  rejected: 2,
  approved: 3,
}

export const reviewStageState = (
  outcome: ReviewOutcome,
  index: number
): ReviewStageState => {
  const current = currentStageIndex[outcome]
  if (index < current) return "done"
  if (index > current) return "pending"
  return outcome === "rejected" ? "rejected" : "current"
}
````

### `apps/admin/next.config.ts`

````ts
import { readdirSync } from "node:fs"
import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next"

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./lib/i18n/request.ts",
  experimental: {
    // Generates locales/en/*.d.json.ts so message arguments are type-checked.
    createMessagesDeclaration: readdirSync("./locales/en")
      .filter((file) => file.endsWith(".json"))
      .map((file) => `./locales/en/${file}`),
  },
})

const isDev = process.env.NODE_ENV === "development"

// The S3 bucket's origin: the browser uploads to it with presigned URLs and
// shows uploaded images from it.
const mediaUploadOrigin = process.env.MEDIA_UPLOAD_ORIGIN
  ? new URL(process.env.MEDIA_UPLOAD_ORIGIN).origin
  : ""

// Without nonces: they need every page rendered per request, which rules out
// the prerendered shells cacheComponents produces. Inline scripts therefore
// stay allowed; the rest still blocks framing, plugins, foreign scripts and
// form or <base> hijacking. Dev needs 'unsafe-eval' for React's error
// overlays.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${mediaUploadOrigin}`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${mediaUploadOrigin}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // For browsers that predate frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Keeps the verify-email token in the URL from leaking to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
  cacheComponents: true,
  transpilePackages: ["@nexora/ui", "@nexora/schemas", "@nexora/shared"],
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // No remotePatterns for the media bucket: its files are private, and the
    // optimizer would cache them for hours under their signed URLs, outliving
    // the signature. Signed images use <Image unoptimized> instead.
  },
  experimental: {
    agentFeedback: true,
  },
}

export default withNextIntl(nextConfig)
````

## Gateway and repo config: files changed

Originals before the media and organization entries were removed.

### `services/api-gateway/src/routes/proxy-routes.ts`

````ts
import { Router } from "express"
import { authenticate } from "../middleware/authenticate"
import { createServiceProxy } from "./create-service-proxy"
import { env } from "../config/gateway-env"

const router: Router = Router()

// Only authenticate is mounted on a path. Mounting strips the prefix from
// req.url, and the proxies need the full URL both to match their pathFilter
// and to forward the original path upstream.
router.use("/api/v1/auth/me", authenticate)
router.use("/api/v1/aggregate", authenticate)
router.use("/api/v1/onboarding", authenticate)
router.use("/api/v1/user", authenticate)
router.use("/api/v1/media", authenticate)
router.use("/api/v1/organization", authenticate)

router.use(createServiceProxy("/api/v1/aggregate", env.AGGREGATE_SERVICE_URL))
router.use(createServiceProxy("/api/v1/onboarding", env.ONBOARDING_SERVICE_URL))
router.use(createServiceProxy("/api/v1/auth", env.AUTH_SERVICE_URL))
router.use(createServiceProxy("/api/v1/user", env.USER_SERVICE_URL))
router.use(createServiceProxy("/api/v1/media", env.MEDIA_SERVICE_URL))
router.use(
  createServiceProxy("/api/v1/organization", env.ORGANIZATION_SERVICE_URL)
)

export default router
````

### `services/api-gateway/src/config/gateway-env.ts`

````ts
import { z } from "zod"
import "dotenv/config"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  AUTH_SERVICE_URL: z.string().url(),
  AGGREGATE_SERVICE_URL: z.string().url(),
  ONBOARDING_SERVICE_URL: z.string().url(),
  USER_SERVICE_URL: z.string().url(),
  MEDIA_SERVICE_URL: z.string().url(),
  ORGANIZATION_SERVICE_URL: z.string().url(),
  CLIENT_ORIGINS: z
    .string()
    .default("http://localhost:3001")
    .transform((val) =>
      val
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  INTERNAL_SERVICE_SECRET: z.string().min(32),
  JWT_ACCESS_SECRET: z.string().min(32),
  // Proxies whose X-Forwarded-For is trusted for the client IP (Express
  // "trust proxy"): the admin Next.js server, plus any load balancer in front.
  // Anything wider lets callers spoof their IP past the rate limits.
  TRUST_PROXY: z
    .string()
    .default("loopback")
    .transform((val) => (/^\d+$/.test(val) ? Number(val) : val)),
})

export const env = envSchema.parse(process.env)
````

### `turbo.json`

````json
{
  "$schema": "https://v2-11-10.turborepo.dev/schema.json",
  "concurrency": "20",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "!.next/dev/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "format": {
      "dependsOn": ["^format"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "@nexora/auth-service#dev": {
      "cache": false,
      "persistent": true,
      "env": ["AUTH_DATABASE_URL"],
      "with": ["@nexora/auth-service#outbox:dev"]
    },
    "@nexora/onboarding-service#dev": {
      "cache": false,
      "persistent": true,
      "env": ["ONBOARDING_DATABASE_URL"],
      "with": ["@nexora/onboarding-service#outbox:dev"]
    },
    "@nexora/user-service#dev": {
      "cache": false,
      "persistent": true,
      "env": ["USER_DATABASE_URL"],
      "with": ["@nexora/user-service#outbox:dev"]
    },
    "@nexora/organization-service#dev": {
      "cache": false,
      "persistent": true,
      "env": ["ORGANIZATION_DATABASE_URL"],
      "with": ["@nexora/organization-service#outbox:dev"]
    },
    "outbox:dev": {
      "cache": false,
      "persistent": true
    }
  }
}
````

### `scripts/prisma.mjs`

````js
// `pnpm prisma <args>` from the root. `pnpm prisma studio` opens Prisma Studio
// for every service's database at once; anything else goes to the Prisma CLI
// as usual.
//
// Prisma 8 has no Studio, so Studio runs from Prisma 7 (fetched by npx), given
// each service's database URL directly instead of its Prisma 8 config.

import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:net"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

const STUDIO_PRISMA_VERSION = "7.10.1"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// Each service reads its own URL from services/<name>/.env.
const SERVICES = [
  { name: "auth", envVar: "AUTH_DATABASE_URL", port: 5555 },
  { name: "user", envVar: "USER_DATABASE_URL", port: 5556 },
  { name: "onboarding", envVar: "ONBOARDING_DATABASE_URL", port: 5557 },
  { name: "organization", envVar: "ORGANIZATION_DATABASE_URL", port: 5558 },
]

const [command, ...args] = process.argv.slice(2)

if (command !== "studio") {
  const child = spawn(
    join(root, "node_modules", ".bin", "prisma"),
    process.argv.slice(2),
    { stdio: "inherit" }
  )
  child.on("exit", (code) => process.exit(code ?? 1))
} else {
  // `pnpm prisma studio auth user` opens only those.
  const selected = args.length
    ? SERVICES.filter(({ name }) => args.includes(name))
    : SERVICES

  const readUrl = ({ name, envVar }) => {
    const envFile = join(root, "services", `${name}-service`, ".env")
    if (!existsSync(envFile)) return undefined
    return parseEnv(readFileSync(envFile, "utf8"))[envVar]
  }

  const isFree = (port) =>
    new Promise((resolve) => {
      const server = createServer()
        .once("error", () => resolve(false))
        .once("listening", () => server.close(() => resolve(true)))
        .listen(port, "127.0.0.1")
    })

  // A Studio left running elsewhere may hold the usual port; take the next
  // free one, skipping those already handed out.
  const taken = new Set()
  const freePort = async (port) => {
    while (taken.has(port) || !(await isFree(port))) port++
    taken.add(port)
    return port
  }

  const children = []
  for (const service of selected) {
    const url = readUrl(service)
    if (!url) {
      console.warn(`[${service.name}] skipped: no ${service.envVar} in .env`)
      continue
    }
    const port = await freePort(service.port)

    // Run outside the service folder so Prisma 7 doesn't pick up its
    // Prisma 8 prisma.config.ts.
    const child = spawn(
      "npx",
      [
        "-y",
        `prisma@${STUDIO_PRISMA_VERSION}`,
        "studio",
        "--url",
        url,
        "--port",
        String(port),
      ],
      // Its own process group, so stopAll also reaches the Studio npx starts.
      { cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: true }
    )

    const prefix = (stream, out) =>
      stream.on("data", (chunk) =>
        chunk
          .toString()
          .split("\n")
          .filter(Boolean)
          .forEach((line) => out.write(`[${service.name}] ${line}\n`))
      )
    prefix(child.stdout, process.stdout)
    prefix(child.stderr, process.stderr)
    child.on("exit", (code) =>
      console.log(`[${service.name}] Studio exited (${code ?? "signal"})`)
    )

    console.log(`[${service.name}] Studio on http://localhost:${port}`)
    children.push(child)
  }

  if (children.length === 0) process.exit(1)

  const stopAll = () => {
    for (const child of children) {
      try {
        process.kill(-child.pid, "SIGTERM")
      } catch {
        // Already gone.
      }
    }
    process.exit(0)
  }
  process.on("SIGINT", stopAll)
  process.on("SIGTERM", stopAll)
}
````
