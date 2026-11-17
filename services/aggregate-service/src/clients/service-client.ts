import { AppError } from "@nexora/shared/express/app-error"
import type { ApiErrorResponse } from "@nexora/shared/types/api"

import { env } from "../config/aggregate-env"

type ServiceName = "auth" | "onboarding" | "user" | "organization" | "media"

const baseUrls: Record<ServiceName, string> = {
  auth: env.AUTH_SERVICE_URL,
  onboarding: env.ONBOARDING_SERVICE_URL,
  user: env.USER_SERVICE_URL,
  organization: env.ORGANIZATION_SERVICE_URL,
  media: env.MEDIA_SERVICE_URL,
}

type QueryValue = string | number | boolean | null | undefined

interface ServiceRequestOptions {
  method?: "GET" | "POST"
  query?: Record<string, QueryValue>
  body?: unknown
}

// Read defensively: a proxy or crashed service may not send the envelope.
type ServiceErrorBody = Partial<Record<keyof ApiErrorResponse, unknown>>

const buildUrl = (
  service: ServiceName,
  path: string,
  query?: Record<string, QueryValue>
) => {
  const url = new URL(path, baseUrls[service])
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  return url
}

// Calls services directly, not through the gateway, with the same headers the
// gateway would set after authenticating the request.
export const fetchFromService = async <T>(
  service: ServiceName,
  path: string,
  userId: string,
  { method = "GET", query, body }: ServiceRequestOptions = {}
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(buildUrl(service, path, query), {
      method,
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        "x-internal-secret": env.INTERNAL_SERVICE_SECRET,
        "x-user-id": userId,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(env.SERVICE_TIMEOUT_MS),
    })
  } catch (error) {
    console.error(`Aggregate service: ${service} service unreachable`, error)
    throw new AppError("Service unavailable", 502, "SERVICE_UNAVAILABLE")
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // Pass the downstream status and code through, e.g. 403
    // ACCOUNT_NOT_ACTIVE from auth, so clients see the real reason.
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
