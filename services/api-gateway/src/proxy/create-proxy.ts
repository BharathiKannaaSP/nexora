import { Request } from "express"
import { Options } from "http-proxy-middleware"
import { env } from "../config/env"

export const createProxyOptions = (target: string): Options => {
  return {
    target,
    changeOrigin: true,
    xfwd: true,
    on: {
      proxyReq: (proxyReq, req) => {
        const request = req as Request & {
          auth?: {
            userId: string
            sessionId?: string
          }
        }

        // Remove headers supplied by the external client.
        proxyReq.removeHeader("x-user-id")
        proxyReq.removeHeader("x-clerk-user-id")
        proxyReq.removeHeader("x-internal-service-secret")

        // Gateway → Service authentication
        proxyReq.setHeader(
          "x-internal-service-secret",
          env.INTERNAL_SERVICE_SECRET
        )

        if (request.auth?.userId) {
          proxyReq.setHeader("x-user-id", request.auth.userId)
        }

        if (request.auth?.sessionId) {
          proxyReq.setHeader("x-session-id", request.auth.sessionId)
        }

        const requestId = request.header("x-request-id")

        if (requestId) {
          proxyReq.setHeader("x-request-id", requestId)
        }
      },
    },
  }
}
