import { z } from "zod"

export interface UpdateMeValidationMessages {
  firstNameRequired: string
  firstNameTooLong: string
  lastNameRequired: string
  lastNameTooLong: string
  usernameRequired: string
  usernameTooLong: string
  invalidEmail: string
  passwordTooShort: string
}

/**
 * Same field rules as sign-up, so an account can't be edited into a state
 * sign-up would have rejected. Every field is optional (PATCH): leave one out
 * to keep its current value. Changing `email` sends a new verification link.
 * `password` is stored hashed; confirming it is left to the client's form.
 */
export const createUpdateMeSchema = (messages: UpdateMeValidationMessages) =>
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
      // Picked from a list, not typed, so it has no user-facing message.
      preferredLocale: z.string().regex(/^[a-z]{2}$/),
      // The /[country] the app opens in after sign-in, e.g. "in". Same
      // format as at sign-up.
      countryCode: z.string().regex(/^[a-z]{2}$/),
    })
    .partial()

export type UpdateMeFormValues = z.input<
  ReturnType<typeof createUpdateMeSchema>
>
