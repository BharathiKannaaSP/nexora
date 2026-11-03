import { createBasicInformationSchema } from "@nexora/schemas/onboarding/basic-information"
import { AtSign, CircleCheck, Lock, Mail, UserRound } from "lucide-react"
import type { useTranslations } from "next-intl"
import type { EntityFormConfig } from "@/components/forms/form-types"

interface BasicInformationFormConfigOptions {
  t: ReturnType<typeof useTranslations<"onboarding">>
  tSignUp: ReturnType<typeof useTranslations<"auth.signUp.form">>
  isEmailVerified: boolean
}

export const createBasicInformationFormConfig = ({
  t,
  tSignUp,
  isEmailVerified,
}: BasicInformationFormConfigOptions): EntityFormConfig => ({
  sections: [
    {
      title: t("pages.basicInformation.title"),
      description: t("pages.basicInformation.description"),
      icon: UserRound,
      isLastField: true,
      fields: [
        "firstName",
        "lastName",
        "userName",
        "email",
        "password",
        "confirmPassword",
      ],
    },
  ],
  fields: [
    {
      name: "firstName",
      label: tSignUp("fields.firstName"),
      type: "text",
      required: true,
      icon: UserRound,
      inputProps: { autoComplete: "given-name" },
    },
    {
      name: "lastName",
      label: tSignUp("fields.lastName"),
      type: "text",
      required: true,
      icon: UserRound,
      inputProps: { autoComplete: "family-name" },
    },
    {
      name: "userName",
      label: tSignUp("fields.userName"),
      type: "text",
      required: true,
      colSpan: 2,
      icon: AtSign,
      description: t("basicInformationForm.usernameHint"),
      inputProps: { autoComplete: "username" },
    },
    {
      name: "email",
      label: tSignUp("fields.email"),
      type: "email",
      description: t("basicInformationForm.emailHint"),
      required: true,
      colSpan: 2,
      icon: Mail,
      endAdornment: isEmailVerified && (
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          {t("basicInformationForm.verified")}
          <CircleCheck />
        </span>
      ),
    },
    {
      name: "password",
      label: tSignUp("fields.password"),
      type: "password",
      colSpan: 2,
      icon: Lock,
      description: t("basicInformationForm.passwordHint"),
      inputProps: { autoComplete: "new-password" },
    },
    {
      name: "confirmPassword",
      label: tSignUp("fields.confirmPassword"),
      type: "password",
      colSpan: 2,
      icon: Lock,
      inputProps: { autoComplete: "new-password" },
    },
  ],
})

// Translations only exist inside the component, so the schema is built per
// render from the caller's translator.
export const createBasicInformationFormSchema = (
  tSignUp: BasicInformationFormConfigOptions["tSignUp"]
) =>
  createBasicInformationSchema({
    firstNameRequired: tSignUp("validation.firstNameRequired"),
    firstNameTooLong: tSignUp("validation.firstNameTooLong"),
    lastNameRequired: tSignUp("validation.lastNameRequired"),
    lastNameTooLong: tSignUp("validation.lastNameTooLong"),
    usernameRequired: tSignUp("validation.usernameRequired"),
    usernameTooLong: tSignUp("validation.usernameTooLong"),
    invalidEmail: tSignUp("validation.invalidEmail"),
    passwordTooShort: tSignUp("validation.passwordTooShort"),
    passwordsDoNotMatch: tSignUp("validation.passwordsDoNotMatch"),
  })
