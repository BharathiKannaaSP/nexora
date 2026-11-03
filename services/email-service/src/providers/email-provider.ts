import { Resend } from "resend"
import { env } from "../config/email-env"
import { renderVerificationEmail } from "../templates/verification-email"

const resend = new Resend(env.RESEND_API_KEY)

export async function sendVerificationEmail(input: {
  email: string
  locale: string
  verificationUrl: string
}): Promise<void> {
  const { subject, text, html } = renderVerificationEmail({
    locale: input.locale,
    verificationUrl: input.verificationUrl,
  })

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    // Resend's test mode only delivers to the account owner, so development
    // can redirect every email there. Production must not set it.
    to: env.EMAIL_TO_OVERRIDE ?? input.email,
    subject,
    text,
    html,
  })

  if (error) {
    // Do not log the verification URL or token.
    throw new Error(
      `Resend failed to send verification email: ${error.message}`
    )
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email ID")
  }
}
