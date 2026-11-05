"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import {
  createSignInSchema,
  type SignInFormValues,
} from "@nexora/schemas/auth/sign-in"

import { AuthForm, type AuthFieldDef } from "@/components/auth/auth-form"
import { savePendingVerification } from "@/features/auth/verify-email/pending-verification"
import { useApiToast } from "@/hooks/use-api-toast"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { login } from "@/lib/api/auth/login"
import { href, isCountry, isCountryLanguage } from "@/lib/i18n/config"

const signInFields: AuthFieldDef<SignInFormValues>[] = [
  {
    name: "identifier",
    type: "text",
    autoComplete: "username",
    inputProps: { autoCapitalize: "none", spellCheck: false },
  },
  { name: "password", type: "password", autoComplete: "current-password" },
]

export const SignInFormContainer = () => {
  const t = useTranslations("auth.signIn.form")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { country, lang } = useLocaleParams()
  const signInSchema = createSignInSchema({
    identifierRequired: t("validation.identifierRequired"),
    identifierTooLong: t("validation.identifierTooLong"),
    passwordRequired: t("validation.passwordRequired"),
  })
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  })
  const applyServerFieldErrors = useServerFieldErrors(form)

  const handleSignIn = async (values: SignInFormValues) => {
    const result = await login(values)
    showApiToast(result)

    const needsVerification = result.success
      ? !result.data.user.isEmailVerified
      : result.code === "EMAIL_NOT_VERIFIED"

    if (needsVerification) {
      savePendingVerification(values.identifier)
      router.push(href(country, lang, "/auth/verify-email"))
      return
    }

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      form.resetField("password")
      return
    }

    // Open the app in the user's saved country and language, e.g. /in/en
    // after onboarding moved them from /fr. Fall back to the current URL if
    // the saved pair isn't (or is no longer) supported.
    const { countryCode, preferredLocale } = result.data.user
    router.push(
      isCountry(countryCode) && isCountryLanguage(countryCode, preferredLocale)
        ? href(countryCode, preferredLocale)
        : href(country, lang)
    )
  }

  return (
    <AuthForm
      form={form}
      onSubmit={handleSignIn}
      fields={signInFields}
      labels={{
        identifier: t("fields.identifier"),
        password: t("fields.password"),
      }}
      submitLabel={t("submit")}
    />
  )
}
