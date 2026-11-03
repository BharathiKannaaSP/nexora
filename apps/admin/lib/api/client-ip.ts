/**
 * The visitor's IP, forwarded to the gateway so its rate limits apply per
 * visitor rather than to this server's single address. apiServer sends it
 * with every call.
 *
 * Takes the last X-Forwarded-For entry: the one added by the proxy nearest
 * this server (Vercel, a load balancer), which sits after anything the
 * visitor sent. Without such a proxy in front, Next.js keeps a visitor-sent
 * header as is, so deploy behind one.
 */
export function getClientIp(requestHeaders: Headers): string | undefined {
  const forwarded = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")
    .at(-1)
    ?.trim()

  return forwarded || requestHeaders.get("x-real-ip")?.trim() || undefined
}
