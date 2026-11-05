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

// The S3 bucket the browser PUTs uploads to, and the CloudFront domain signed
// file URLs point at. Both optional, so the app still builds without them.
const mediaUploadOrigin = process.env.MEDIA_UPLOAD_ORIGIN ?? ""
const mediaCdnOrigin = process.env.MEDIA_CDN_ORIGIN ?? ""

// Without nonces: they need every page rendered per request, which rules out
// the prerendered shells cacheComponents produces. Inline scripts therefore
// stay allowed; the rest still blocks framing, plugins, foreign scripts and
// form or <base> hijacking. Dev needs 'unsafe-eval' for React's error
// overlays.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${mediaCdnOrigin}`.trim(),
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
  },
  experimental: {
    agentFeedback: true,
  },
}

export default withNextIntl(nextConfig)
