"use client"
import {
  createSignUpSchema,
  type SignUpFormValues,
} from "@nexora/schemas/auth/sign-up"
import { zodResolver } from "@hookform/resolvers/zod"
import { SignUpForm } from "./sign-up-form"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { register } from "@/lib/api/auth/register"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { href } from "@/lib/i18n/config"
import { markJustRegistered } from "@/features/auth/sign-in/registered-banner"

export const SignUpFormContainer = () => {
  const t = useTranslations("auth.signUp.form")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { country, lang } = useParams<{ country: string; lang: string }>()
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
    <SignUpForm
      form={form}
      onSubmit={handleSignUp}
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
