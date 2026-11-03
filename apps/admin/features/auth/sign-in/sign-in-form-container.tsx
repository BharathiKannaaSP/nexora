"use client"
import {
  createSignInSchema,
  type SignInFormValues,
} from "@nexora/schemas/auth/sign-in"
import { zodResolver } from "@hookform/resolvers/zod"
import { SignInForm } from "./sign-in-form"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { login } from "@/lib/api/auth/login"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { href, isCountry, isCountryLanguage } from "@/lib/i18n/config"
import { savePendingVerification } from "@/features/auth/verify-email/pending-verification"

export const SignInFormContainer = () => {
  const t = useTranslations("auth.signIn.form")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { country, lang } = useParams<{ country: string; lang: string }>()
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
    <SignInForm
      form={form}
      onSubmit={handleSignIn}
      labels={{
        identifier: t("fields.identifier"),
        password: t("fields.password"),
      }}
      submitLabel={t("submit")}
    />
  )
}
