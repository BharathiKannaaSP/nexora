import { ACCESS_COOKIE_NAME } from "@nexora/shared/constants/auth"
import type { ApiErrorResponse, ApiFieldError } from "@nexora/shared/types/api"
import { cookies, headers as requestHeaders } from "next/headers"
import { getClientIp } from "./client-ip"

type QueryValue = string | number | boolean | null | undefined

export interface ApiServerOptions extends Omit<RequestInit, "body" | "method"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, QueryValue>
  /** Sent as `Authorization: Bearer <token>` for routes the gateway protects. */
  accessToken?: string
  /**
   * Sends the access token cookie as `accessToken`, failing with
   * ACCESS_TOKEN_REQUIRED when there is none. proxy.ts has already refreshed
   * it for this request, so it's only read here. Defaults to `true`; public
   * routes (sign-in, register, refresh, ...) pass `false`.
   */
  authenticated?: boolean
  /**
   * The browser request being served, whose IP is forwarded for the
   * gateway's rate limits. Defaults to the current request via `headers()`;
   * proxy.ts passes `request.headers` instead.
   */
  incomingHeaders?: Headers
  /** Called with the raw response before it's parsed, e.g. to read `Set-Cookie`. */
  onResponse?: (response: Response) => void
}

const isApiErrorResponse = (data: unknown): data is ApiErrorResponse =>
  !!data &&
  typeof data === "object" &&
  "success" in data &&
  data.success === false &&
  "code" in data

export class ApiError extends Error {
  public readonly code: string
  public readonly errors?: ApiFieldError[]

  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
    this.code = isApiErrorResponse(data) ? data.code : "UNKNOWN_ERROR"
    this.errors = isApiErrorResponse(data) ? data.errors : undefined
  }
}

const getBaseUrl = () => {
  const baseUrl = process.env.API_GATEWAY
  if (!baseUrl) {
    throw new Error("API_GATEWAY environment variable is not set")
  }
  return baseUrl.replace(/\/+$/, "")
}

const buildUrl = (endpoint: string, query?: Record<string, QueryValue>) => {
  const url = new URL(`${getBaseUrl()}/${endpoint.replace(/^\/+/, "")}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url
}

const parseResponse = async (response: Response) => {
  if (response.status === 204) return undefined
  const contentType = response.headers.get("content-type") ?? ""
  return contentType.includes("application/json")
    ? response.json()
    : response.text()
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === "object" && "message" in data) {
    const { message } = data as { message: unknown }
    if (typeof message === "string") return message
  }
  return typeof data === "string" && data ? data : fallback
}

const accessTokenRequired: ApiErrorResponse = {
  success: false,
  message: "Access token is required",
  code: "ACCESS_TOKEN_REQUIRED",
}

/** The access token cookie, or the same 401 the gateway sends without one. */
const readAccessToken = async () => {
  const accessToken = (await cookies()).get(ACCESS_COOKIE_NAME)?.value
  if (!accessToken) {
    throw new ApiError(accessTokenRequired.message, 401, accessTokenRequired)
  }
  return accessToken
}

export async function apiServer<T = unknown>(
  endpoint: string,
  {
    method = "GET",
    body,
    query,
    headers,
    accessToken: givenAccessToken,
    authenticated = true,
    incomingHeaders,
    onResponse,
    ...init
  }: ApiServerOptions = {}
): Promise<T> {
  const accessToken =
    givenAccessToken ?? (authenticated ? await readAccessToken() : undefined)
  const isJsonBody = body !== undefined && !(body instanceof FormData)
  // Sent with every call so the gateway limits each visitor, not this server.
  const clientIp = getClientIp(incomingHeaders ?? (await requestHeaders()))

  const response = await fetch(buildUrl(endpoint, query), {
    ...init,
    method,
    headers: {
      Accept: "application/json",
      ...(isJsonBody && { "Content-Type": "application/json" }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...(clientIp && { "X-Forwarded-For": clientIp }),
      ...headers,
    },
    body: isJsonBody ? JSON.stringify(body) : (body as FormData | undefined),
  })

  onResponse?.(response)

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data, response.statusText || "Request failed"),
      response.status,
      data
    )
  }

  return data as T
}

type MethodOptions = Omit<ApiServerOptions, "method" | "body">

/** Client for the API gateway, e.g. `api.post("/auth/register", body)`. */
export const api = {
  get: <T = unknown>(endpoint: string, options?: MethodOptions) =>
    apiServer<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: MethodOptions
  ) => apiServer<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: MethodOptions
  ) => apiServer<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: MethodOptions
  ) => apiServer<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = unknown>(endpoint: string, options?: MethodOptions) =>
    apiServer<T>(endpoint, { ...options, method: "DELETE" }),
}
