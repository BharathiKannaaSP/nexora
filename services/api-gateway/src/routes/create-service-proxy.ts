import { createProxyMiddleware } from "http-proxy-middleware"
import { env } from "../config/gateway-env"
import type { AuthenticatedRequest } from "../middleware/authenticate"

export const createServiceProxy = (prefix: string, target: string) => {
  return createProxyMiddleware({
    pathFilter: (path) => path === prefix || path.startsWith(`${prefix}/`),
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.removeHeader("x-user-id")
        proxyReq.removeHeader("x-internal-secret")

        proxyReq.setHeader("x-internal-secret", env.INTERNAL_SERVICE_SECRET)

        const authenticatedReq = req as AuthenticatedRequest

        if (authenticatedReq.userId) {
          proxyReq.setHeader("x-user-id", authenticatedReq.userId)
        }
      },
      // Replaces the default plain-text error page, which echoes the
      // request's host and path.
      error: (error, _req, res) => {
        console.error("API Gateway proxy error:", error)

        if (!("writeHead" in res)) {
          res.destroy()
          return
        }
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" })
        }
        res.end(
          JSON.stringify({
            success: false,
            message: "Service unavailable",
            code: "INTERNAL_SERVER_ERROR",
          })
        )
      },
    },
  })
}
