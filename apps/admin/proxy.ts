import {
  getCountryDefaultLanguage,
  href,
  isCountry,
  isCountryLanguage,
  isLocale,
  localizedPath,
} from "@/lib/i18n/config"
import {
  nextWithSession,
  resolveSession,
  withSessionCookies,
} from "@/lib/api/auth/helpers/proxy-session"
import { getUserCountry } from "@/lib/i18n/get-user-country"
import { NextResponse, type NextRequest } from "next/server"

// The root layout lives under app/[country]/[lang]. Rejecting unsupported
// countries and languages here, instead of relying on notFound() in that
// layout, returns a server-rendered 404 page rather than an empty shell
// rendered on the client, and keeps the layout from throwing during
// `instant` validation.
export async function proxy(request: NextRequest) {
  const [, country, lang, ...rest] = request.nextUrl.pathname.split("/")

  // The visitor's country only picks the landing page; any supported country
  // in the URL is allowed, and access is enforced by the backend.
  if (!country) {
    const userCountry = getUserCountry(request.headers)
    const url = request.nextUrl.clone()
    url.pathname = localizedPath(
      userCountry,
      getCountryDefaultLanguage(userCountry)
    )
    return NextResponse.redirect(url)
  }

  if (!isCountry(country) || (lang && !isLocale(lang))) {
    return NextResponse.rewrite(new URL("/not-found", request.url))
  }

  // A missing language, or one the country doesn't support (e.g. /jp/ta after
  // switching the country from India), falls back to the country's default
  // language while keeping the rest of the path.
  if (!lang || !isCountryLanguage(country, lang)) {
    const url = request.nextUrl.clone()
    url.pathname = localizedPath(
      country,
      getCountryDefaultLanguage(country),
      rest.join("/") || "/"
    )
    return NextResponse.redirect(url)
  }

  // Auth pages handle their own cookies (sign-in sets them), so they skip the
  // session check.
  if (rest[0] === "auth") {
    return NextResponse.next()
  }

  const session = await resolveSession(request)

  if (!session.signedIn) {
    const url = request.nextUrl.clone()
    url.pathname = href(country, lang, "/auth/sign-in")
    url.search = ""
    return withSessionCookies(NextResponse.redirect(url), session)
  }

  return nextWithSession(request, session)
}

export const config = {
  // Skip Next.js internals and files served from public/ (any path with a
  // file extension), so they aren't treated as /[country]/[lang] routes.
  matcher: ["/((?!_next/|.*\\..*).*)"],
}
