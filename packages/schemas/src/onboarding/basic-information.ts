import { z } from "zod"
import {
  createUpdateMeSchema,
  type UpdateMeValidationMessages,
} from "../auth/update-me"

export interface BasicInformationValidationMessages extends UpdateMeValidationMessages {
  passwordsDoNotMatch: string
}

/**
 * Same rules as editing the account, with the names and username required.
 * Email isn't sent back: it was verified at sign-up. The password is optional:
 * blank keeps the one set at sign-up, since it can't be read back to prefill.
 * confirmPassword only exists client-side, like on sign-up.
 */
export const createBasicInformationSchema = (
  messages: BasicInformationValidationMessages
) => {
  const updateMeSchema = createUpdateMeSchema(messages)

  return updateMeSchema
    .pick({ firstName: true, lastName: true, userName: true, email: true })
    .required()
    .extend({ password: z.string(), confirmPassword: z.string() })
    .superRefine((data, ctx) => {
      if (data.password !== "") {
        const result = updateMeSchema.shape.password.safeParse(data.password)
        result.error?.issues.forEach(({ message }) =>
          ctx.addIssue({ code: "custom", path: ["password"], message })
        )
      }

      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: messages.passwordsDoNotMatch,
        })
      }
    })
}

export type BasicInformationFormValues = z.input<
  ReturnType<typeof createBasicInformationSchema>
>
