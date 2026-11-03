"use client"

import type { BasicInformationFormValues as BasicInformationValues } from "@nexora/schemas/onboarding/basic-information"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { EntityForm } from "@/components/forms/entity-form"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { updateMe } from "@/lib/api/auth/update-me"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import {
  createBasicInformationFormConfig,
  createBasicInformationFormSchema,
} from "./basic-information-form-config"

export const BasicInformationForm = () => {
  const t = useTranslations("onboarding")
  const tSignUp = useTranslations("auth.signUp.form")
  const tActions = useTranslations("common.actions")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { account } = useBootstrap()

  const schema = createBasicInformationFormSchema(tSignUp)

  const form = useForm<BasicInformationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: account.firstName,
      lastName: account.lastName,
      userName: account.userName,
      email: account.email,
      password: "",
      confirmPassword: "",
    },
  })
  const applyServerFieldErrors = useServerFieldErrors(form)

  const handleSubmit = async (values: BasicInformationValues) => {
    const result = await updateMe({
      firstName: values.firstName,
      lastName: values.lastName,
      userName: values.userName,
      email: values.email,
      // Left out when blank, so the current password is kept.
      password: values.password || undefined,
    })
    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    // Don't keep the new password around in form state once it's saved.
    form.reset({ ...values, password: "", confirmPassword: "" })

    // Only once the details are saved; its success toast is skipped (no
    // message in codes.json) so the user sees just "Account updated".
    const stepResult = await updateOnboardingStep({ step: "CHOOSE_PATH" })
    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }

    // Re-run the page's BootstrapGuard so it moves on once onboarding has.
    router.refresh()
  }

  const config = createBasicInformationFormConfig({
    t,
    tSignUp,
    isEmailVerified: account.isEmailVerified,
  })

  return (
    <EntityForm
      form={form}
      config={config}
      onSubmit={handleSubmit}
      actions={[
        {
          key: "previous",
          label: tActions("previous"),
          variant: "outline",
          disabled: true,
          onClick: () => form.reset(),
        },
        {
          key: "next",
          label: tActions("next"),
          type: "submit",
          loading: form.formState.isSubmitting,
        },
      ]}
    />
  )
}
