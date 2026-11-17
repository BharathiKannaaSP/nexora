"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

import type { BasicInformationFormValues as BasicInformationValues } from "@nexora/schemas/onboarding/basic-information"
import type { SavedFile } from "@nexora/schemas/onboarding/create-organization"

import { EntityForm } from "@/components/forms/entity-form"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { updateMe } from "@/lib/api/auth/update-me"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { deleteUpload } from "@/lib/api/media/delete-upload"
import { uploadIfNew } from "@/lib/media/upload-file"

import {
  createBasicInformationFormConfig,
  createBasicInformationFormSchema,
} from "./basic-information-form-config"

/**
 * The saved avatar, put back in the field. Only its key is stored; that's
 * all a resubmit sends, and the name is just something to show.
 */
const savedAvatar = (key: string): SavedFile => ({
  key,
  originalFileName: `avatar.${key.split(".").pop()}`,
  contentType: "",
  sizeBytes: 0,
})

export const BasicInformationForm = () => {
  const t = useTranslations("onboarding")
  const tSignUp = useTranslations("auth.signUp.form")
  const tActions = useTranslations("common.actions")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { account } = useBootstrap()

  const schema = createBasicInformationFormSchema(t, tSignUp)

  const form = useForm<BasicInformationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: account.firstName,
      lastName: account.lastName,
      userName: account.userName,
      email: account.email,
      profileImage: account.profileImageKey
        ? savedAvatar(account.profileImageKey)
        : null,
      password: "",
      confirmPassword: "",
    },
  })
  const applyServerFieldErrors = useServerFieldErrors(form)

  const handleSubmit = async (values: BasicInformationValues) => {
    // A newly picked image goes straight to S3 through media-service; the
    // saved one is sent again as is.
    let profileImageKey: string | null = null
    if (values.profileImage) {
      const upload = await uploadIfNew(values.profileImage, "user-avatar")
      if (!upload.success) {
        showApiToast(upload)
        return
      }
      profileImageKey = upload.data.key
    }

    const result = await updateMe({
      firstName: values.firstName,
      lastName: values.lastName,
      userName: values.userName,
      email: values.email,
      // Null removes the image.
      profileImageKey,
      // Left out when blank, so the current password is kept.
      password: values.password || undefined,
    })
    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    // The old image is no longer on the account: delete it from S3. A
    // failure only leaves an unused object behind.
    const previousKey = account.profileImageKey
    if (previousKey && previousKey !== profileImageKey) {
      const deleted = await deleteUpload(previousKey)
      if (!deleted.success) {
        console.error(`Couldn't delete upload ${previousKey}`, deleted.code)
      }
    }

    // Don't keep the new password around in form state once it's saved.
    form.reset({
      ...values,
      profileImage: profileImageKey ? savedAvatar(profileImageKey) : null,
      password: "",
      confirmPassword: "",
    })

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
