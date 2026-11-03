import { DEFAULT_LOCALE, RTL_LOCALES } from "@nexora/shared/constants/i18n"
import { env } from "../config/email-env"
import ar from "../locales/ar.json" with { type: "json" }
import de from "../locales/de.json" with { type: "json" }
import en from "../locales/en.json" with { type: "json" }
import es from "../locales/es.json" with { type: "json" }
import fr from "../locales/fr.json" with { type: "json" }
import hi from "../locales/hi.json" with { type: "json" }
import it from "../locales/it.json" with { type: "json" }
import ja from "../locales/ja.json" with { type: "json" }
import kn from "../locales/kn.json" with { type: "json" }
import ko from "../locales/ko.json" with { type: "json" }
import ml from "../locales/ml.json" with { type: "json" }
import ms from "../locales/ms.json" with { type: "json" }
import nl from "../locales/nl.json" with { type: "json" }
import pt from "../locales/pt.json" with { type: "json" }
import ta from "../locales/ta.json" with { type: "json" }
import zh from "../locales/zh.json" with { type: "json" }

type EmailMessages = typeof en

// Typed against the English file so a locale missing a key fails typecheck
const messages: Record<string, EmailMessages> = {
  ar,
  de,
  en,
  es,
  fr,
  hi,
  it,
  ja,
  kn,
  ko,
  ml,
  ms,
  nl,
  pt,
  ta,
  zh,
}

// hasOwn, not `in`: inherited keys like "constructor" aren't locales.
const resolveLocale = (locale: string) =>
  Object.hasOwn(messages, locale) ? locale : DEFAULT_LOCALE

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

/**
 * Links to the verify page in the same country and language the user
 * signed up with, e.g. /in/ta/auth/verify-email?token=...
 */
export function buildVerificationUrl(input: {
  country: string
  locale: string
  token: string
}): string {
  const url = new URL(
    `/${encodeURIComponent(input.country)}/${resolveLocale(input.locale)}/auth/verify-email`,
    env.FRONTEND_ADMIN_URL
  )
  url.searchParams.set("token", input.token)

  return url.toString()
}

export function renderVerificationEmail(input: {
  locale: string
  verificationUrl: string
}): { subject: string; text: string; html: string } {
  const locale = resolveLocale(input.locale)
  const t = messages[locale]!.verification
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr"
  const copyright = t.copyright.replace(
    "{year}",
    String(new Date().getFullYear())
  )
  const url = escapeHtml(input.verificationUrl)

  const text = [
    t.heading,
    "",
    t.intro,
    input.verificationUrl,
    "",
    t.expiry,
    t.ignore,
  ].join("\n")

  const html = `
      <!doctype html>
      <html lang="${locale}" dir="${dir}">
        <body style="margin:0;padding:0;background:#f5f7f6;font-family:Arial,Helvetica,sans-serif;color:#171717;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
            style="background:#f5f7f6;padding:32px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" dir="${dir}"
                  style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:28px 32px 20px;text-align:center;">
                      <div style="font-size:25px;font-weight:700;letter-spacing:2px;">
                        NEXORA
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:16px 32px 36px;text-align:center;">
                      <div style="display:inline-block;background:#e8f5ef;color:#176b4d;
                        font-size:12px;font-weight:600;padding:7px 12px;border-radius:20px;">
                        ${escapeHtml(t.badge)}
                      </div>

                      <h1 style="font-size:27px;line-height:1.3;margin:22px 0 12px;">
                        ${escapeHtml(t.heading)}
                      </h1>

                      <p style="font-size:15px;line-height:1.8;color:#525252;margin:0 0 26px;">
                        ${escapeHtml(t.intro)}
                      </p>

                      <a href="${url}"
                        style="display:inline-block;background:#176b4d;color:#ffffff;
                        padding:14px 28px;border-radius:7px;text-decoration:none;
                        font-size:15px;font-weight:600;">
                        ${escapeHtml(t.button)}
                      </a>

                      <p style="font-size:13px;line-height:1.7;color:#737373;margin:26px 0 8px;">
                        ${escapeHtml(t.expiry)}
                      </p>

                      <p style="font-size:13px;line-height:1.7;color:#737373;margin:0;">
                        ${escapeHtml(t.fallback)}
                      </p>

                      <p dir="ltr" style="font-size:12px;line-height:1.7;overflow-wrap:anywhere;margin-top:10px;">
                        <a href="${url}" style="color:#176b4d;">${url}</a>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="border-top:1px solid #eeeeee;padding:22px 32px;text-align:center;">
                      <p style="font-size:12px;line-height:1.7;color:#737373;margin:0;">
                        ${escapeHtml(t.ignore)}
                      </p>
                      <p style="font-size:11px;color:#a3a3a3;margin:12px 0 0;">
                        ${escapeHtml(copyright)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

  return { subject: t.subject, text, html }
}
