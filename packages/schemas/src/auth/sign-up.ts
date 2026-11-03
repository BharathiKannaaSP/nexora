import { z } from "zod"

export interface SignUpValidationMessages {
  firstNameRequired: string
  firstNameTooLong: string
  lastNameRequired: string
  lastNameTooLong: string
  usernameRequired: string
  usernameTooLong: string
  invalidEmail: string
  passwordTooShort: string
  confirmPasswordTooShort: string
  passwordsDoNotMatch: string
}

export const createSignUpSchema = (messages: SignUpValidationMessages) =>
  z
    .object({
      firstName: z
        .string()
        .trim()
        .min(2, messages.firstNameRequired)
        .max(50, messages.firstNameTooLong),
      lastName: z
        .string()
        .trim()
        .min(2, messages.lastNameRequired)
        .max(50, messages.lastNameTooLong),
      userName: z
        .string()
        .trim()
        .min(2, messages.usernameRequired)
        .max(50, messages.usernameTooLong),
      email: z.string().trim().email(messages.invalidEmail),
      password: z.string().min(8, messages.passwordTooShort),
      confirmPassword: z.string().min(8, messages.confirmPasswordTooShort),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsDoNotMatch,
      path: ["confirmPassword"],
    })

export type SignUpFormValues = z.input<ReturnType<typeof createSignUpSchema>>

/**
 * Sent alongside the form values so the auth service can remember the
 * user's language and send emails (and links) in it. Unsupported values
 * fall back to English when the email is rendered.
 */
export const signUpLocaleSchema = z.object({
  locale: z
    .string()
    .regex(/^[a-z]{2}$/)
    .default("en"),
  country: z
    .string()
    .regex(/^[a-z]{2}$/)
    .default("in"),
})

export type SignUpLocale = z.infer<typeof signUpLocaleSchema>

export const verifyEmailSchema = z.object({
  token: z.string().min(1).max(200),
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

/** Email or username, as typed on sign-in. */
export const resendVerificationSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
})

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
