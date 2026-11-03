import { z } from "zod"

export interface SignInValidationMessages {
  identifierRequired: string
  identifierTooLong: string
  passwordRequired: string
}

/**
 * `identifier` accepts either an email address or a username; the auth
 * service decides which one it is when looking up the user.
 */
export const createSignInSchema = (messages: SignInValidationMessages) =>
  z.object({
    identifier: z
      .string()
      .trim()
      .min(1, messages.identifierRequired)
      .max(254, messages.identifierTooLong),
    password: z.string().min(1, messages.passwordRequired),
  })

export type SignInFormValues = z.input<ReturnType<typeof createSignInSchema>>
