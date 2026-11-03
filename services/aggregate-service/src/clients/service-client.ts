import type { ApiErrorResponse } from "@nexora/shared/types/api"
import { env } from "../config/aggregate-env"
import { AppError } from "@nexora/shared/express/app-error"

type ServiceName = "auth" | "onboarding" | "user"

const baseUrls: Record<ServiceName, string> = {
  auth: env.AUTH_SERVICE_URL,
  onboarding: env.ONBOARDING_SERVICE_URL,
  user: env.USER_SERVICE_URL,
}

// Read defensively: a proxy or crashed service may not send the envelope.
type ServiceErrorBody = Partial<Record<keyof ApiErrorResponse, unknown>>

// Calls services directly, not through the gateway, with the same headers the
// gateway would set after authenticating the request.
export const fetchFromService = async <T>(
  service: ServiceName,
  path: string,
  userId: string
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(new URL(path, baseUrls[service]), {
      headers: {
        accept: "application/json",
        "x-internal-secret": env.INTERNAL_SERVICE_SECRET,
        "x-user-id": userId,
      },
      signal: AbortSignal.timeout(env.SERVICE_TIMEOUT_MS),
    })
  } catch (error) {
    console.error(`Aggregate service: ${service} service unreachable`, error)
    throw new AppError("Service unavailable", 502, "SERVICE_UNAVAILABLE")
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // Pass the downstream status and code through, e.g. 403
    // ACCOUNT_NOT_ACTIVE from auth, so clients see the real reason.
    const errorBody = (body ?? {}) as ServiceErrorBody

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

  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new AppError("Service unavailable", 502, "SERVICE_UNAVAILABLE")
  }

  return body.data as T
}
