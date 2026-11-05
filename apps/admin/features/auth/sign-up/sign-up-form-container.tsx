"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import {
  createSignUpSchema,
  type SignUpFormValues,
} from "@nexora/schemas/auth/sign-up"

import { AuthForm, type AuthFieldDef } from "@/components/auth/auth-form"
import { markJustRegistered } from "@/features/auth/sign-in/registered-banner"
import { useApiToast } from "@/hooks/use-api-toast"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { register } from "@/lib/api/auth/register"
import { href } from "@/lib/i18n/config"

// First and last name share a row on wide screens; the rest span both.
const signUpFields: AuthFieldDef<SignUpFormValues>[] = [
  { name: "firstName", type: "text", autoComplete: "given-name" },
  { name: "lastName", type: "text", autoComplete: "family-name" },
  {
    name: "userName",
    type: "text",
    autoComplete: "username",
    className: "sm:col-span-2",
  },
  {
    name: "email",
    type: "email",
    autoComplete: "email",
    className: "sm:col-span-2",
  },
  {
    name: "password",
    type: "password",
    autoComplete: "new-password",
    className: "sm:col-span-2",
  },
  {
    name: "confirmPassword",
    type: "password",
    autoComplete: "new-password",
    className: "sm:col-span-2",
  },
]

export const SignUpFormContainer = () => {
  const t = useTranslations("auth.signUp.form")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { country, lang } = useLocaleParams()
  const signUpSchema = createSignUpSchema({
    firstNameRequired: t("validation.firstNameRequired"),
    firstNameTooLong: t("validation.firstNameTooLong"),
    lastNameRequired: t("validation.lastNameRequired"),
    lastNameTooLong: t("validation.lastNameTooLong"),
    invalidEmail: t("validation.invalidEmail"),
    usernameRequired: t("validation.usernameRequired"),
    usernameTooLong: t("validation.usernameTooLong"),
    passwordTooShort: t("validation.passwordTooShort"),
    confirmPasswordTooShort: t("validation.confirmPasswordTooShort"),
    passwordsDoNotMatch: t("validation.passwordsDoNotMatch"),
  })
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      userName: "",
      password: "",
      confirmPassword: "",
    },
  })
  const applyServerFieldErrors = useServerFieldErrors(form)

  const handleSignUp = async (values: SignUpFormValues) => {
    const result = await register(values, { locale: lang, country })
    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    markJustRegistered()
    router.push(href(country, lang, "/auth/sign-in"))
  }

  return (
    <AuthForm
      form={form}
      onSubmit={handleSignUp}
      fields={signUpFields}
      fieldsClassName="grid grid-cols-1 sm:grid-cols-2"
      labels={{
        firstName: t("fields.firstName"),
        lastName: t("fields.lastName"),
        email: t("fields.email"),
        userName: t("fields.userName"),
        password: t("fields.password"),
        confirmPassword: t("fields.confirmPassword"),
      }}
      submitLabel={t("submit")}
    />
  )
}
