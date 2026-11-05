"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  isSavedFile,
  type CreateOrganizationFormValues,
  type CreateOrganizationRequestBody,
  type OrganizationDocumentSlot,
} from "@nexora/schemas/onboarding/create-organization"
import type { Country } from "@nexora/shared/types/country"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm, useWatch, type FieldPath } from "react-hook-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { UploadedFilesTable } from "@/components/forms/uploaded-files-table"
import {
  createCreateOrganizationFormSchema,
  createOrganizationFormConfig,
  DOCUMENT_FIELDS,
} from "./create-organization-form-config"
import { toCreateOrganizationFormDefaults } from "./create-organization-form-defaults"
import { EntityForm } from "@/components/forms/entity-form"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { submitCreateOrganizationRequest } from "@/lib/api/onboarding/submit-create-organization-request"
import { href } from "@/lib/i18n/config"
import { ONBOARDING_PATHS } from "@/lib/bootstrap/bootstrap-path"
import { uploadIfNew, type UploadedFile } from "@/lib/media/upload-file"
import { deleteUpload } from "@/lib/api/media/delete-upload"
import { removeOrganizationRequestFile } from "@/lib/api/onboarding/remove-organization-request-file"
import type { CreateOrganizationFormDetailsResponseData } from "@nexora/shared/types/onboarding"
import type { ApiResult } from "@/lib/api/result"

interface CreateOrganizationFormProps {
  countries: Country[]
  createOrganizationFormDetails: ApiResult<CreateOrganizationFormDetailsResponseData>
}

const CreateOrganizationForm = ({
  countries,
  createOrganizationFormDetails,
}: CreateOrganizationFormProps) => {
  const t = useTranslations("onboarding")
  const tActions = useTranslations("common.actions")
  const { user } = useBootstrap()
  const { country: urlCountry, lang } = useParams<{
    country: string
    lang: string
  }>()
  const showApiToast = useApiToast()
  const router = useRouter()

  const schema = useMemo(() => createCreateOrganizationFormSchema(t), [t])

  // The organization starts in the user's own country, else the URL's.
  const savedCode = user?.bioCountry?.toUpperCase()
  const initialCountry =
    countries.find(({ code }) => code === savedCode) ??
    countries.find(({ code }) => code === urlCountry.toUpperCase())

  // The saved request, when the user comes back to step 3; else null.
  const savedRequest = createOrganizationFormDetails.success
    ? createOrganizationFormDetails.data.createOrganizationFormDetails
    : null

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toCreateOrganizationFormDefaults(
      savedRequest,
      initialCountry?.code ?? ""
    ),
  })

  const applyServerFieldErrors = useServerFieldErrors(form)

  // The picked (or saved) logo and documents, listed under the upload cards.
  const [logoValue, documentValues] = useWatch({
    control: form.control,
    name: ["proposedLogo", "proposedDocuments"],
  })
  /**
   * Deletes a saved logo or document for good, from the X on its upload card
   * or the table's Delete. It's taken off the saved request first, then
   * deleted from S3, so the request never points at a missing file and a
   * refresh doesn't bring it back. Resolves true once it's off the request.
   */
  const deleteSavedFile = async (value: unknown) => {
    if (!isSavedFile(value)) return true

    const removed = await removeOrganizationRequestFile(value.key)
    if (!removed.success) {
      showApiToast(removed)
      return false
    }

    // Off the request already, so a failure here only leaves an unused
    // object behind; the field is cleared either way.
    const deleted = await deleteUpload(value.key)
    if (deleted.success) showApiToast(deleted)
    else console.error(`Couldn't delete upload ${value.key}`, deleted.code)

    return true
  }

  // Clears a field: X on its card, or Delete in the table.
  const removeFile = (name: FieldPath<CreateOrganizationFormValues>) => () =>
    // null, not undefined: undefined would bring back the saved default.
    form.setValue(name, null as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: form.formState.isSubmitted,
    })

  const uploadedFiles = [
    {
      id: "proposedLogo",
      label: t("createOrganizationForm.fields.logo"),
      value: logoValue,
      onRemove: removeFile("proposedLogo"),
      onDeleteSavedFile: deleteSavedFile,
    },
    ...DOCUMENT_FIELDS.map(({ name }) => ({
      id: name,
      label: t(`createOrganizationForm.documents.${name}.label`),
      value: documentValues?.[name],
      onRemove: removeFile(`proposedDocuments.${name}`),
      onDeleteSavedFile: deleteSavedFile,
    })),
  ]
  const hasUploadedFiles = uploadedFiles.some(({ value }) => value)

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  )

  const createOrganizationConfig = createOrganizationFormConfig({
    t,
    countries,
    selectedCountryCode: initialCountry?.code,
    lang,
    regionNames,
    onDeleteSavedFile: deleteSavedFile,
  })

  const handlePreviousStep = async () => {
    const stepResult = await updateOnboardingStep({
      step: "CHOOSE_PATH",
    })
    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }
    router.replace(href(urlCountry, lang, ONBOARDING_PATHS.BASIC_INFORMATION))
  }

  /**
   * Uploads newly picked files straight to S3 (saved ones are kept as they
   * are), then submits the request with their keys. The request also moves
   * onboarding on to REVIEW.
   */
  const handleSubmit = async (values: CreateOrganizationFormValues) => {
    // Parsed again for the schema's output type: trimmed, enums narrowed.
    const { proposedLogo, proposedDocuments, ...fields } = schema.parse(values)

    const documentSlots = (
      Object.keys(proposedDocuments) as OrganizationDocumentSlot[]
    ).filter((slot) => proposedDocuments[slot])

    // All at once; each upload is signed for its own file only.
    const [logo, ...documents] = await Promise.all([
      uploadIfNew(proposedLogo, "org-logo"),
      ...documentSlots.map((slot) =>
        uploadIfNew(proposedDocuments[slot]!, "org-document")
      ),
    ])

    if (!logo.success) {
      showApiToast(logo)
      return
    }

    const uploadedDocuments: Partial<
      Record<OrganizationDocumentSlot, UploadedFile>
    > = {}

    for (const [i, slot] of documentSlots.entries()) {
      const document = documents[i]!
      if (!document.success) {
        showApiToast(document)
        return
      }
      uploadedDocuments[slot] = document.data
    }

    const result = await submitCreateOrganizationRequest({
      ...fields,
      type: "CREATE",
      proposedLogoKey: logo.data.key,
      // The schema requires the three mandatory slots; the form already did.
      proposedDocuments:
        uploadedDocuments as CreateOrganizationRequestBody["proposedDocuments"],
    })

    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    // Saved files the user deleted or replaced are no longer used by the
    // request now saved, so they can go. Done only now, so a request is
    // never left pointing at a missing file. A failure only leaves an
    // unused object behind, so it doesn't stop the user.
    const keptKeys = new Set([
      logo.data.key,
      ...Object.values(uploadedDocuments).map(({ key }) => key),
    ])
    const unusedKeys = [
      savedRequest?.proposedLogoObjectKey,
      ...(savedRequest?.proposedDocuments ?? []).map(
        ({ objectKey }) => objectKey
      ),
    ].filter((key): key is string => !!key && !keptKeys.has(key))

    await Promise.all(
      unusedKeys.map(async (key) => {
        const deleted = await deleteUpload(key)
        if (!deleted.success) {
          console.error(`Couldn't delete unused upload ${key}`, deleted.code)
        }
      })
    )

    // Re-run the page's BootstrapGuard so it sends the user to REVIEW.
    router.refresh()
  }

  return (
    <div>
      <EntityForm
        form={form}
        config={createOrganizationConfig}
        onSubmit={handleSubmit}
        actions={[
          {
            key: "previous",
            label: tActions("previous"),
            variant: "outline",
            onClick: () => handlePreviousStep(),
          },
          {
            key: "next",
            label: tActions("next"),
            type: "submit",
            loading: form.formState.isSubmitting,
          },
        ]}
      >
        {hasUploadedFiles && (
          <Card className="rounded-sm shadow-sm">
            <CardHeader>
              <CardTitle>
                {t("createOrganizationForm.uploadedFiles.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("createOrganizationForm.uploadedFiles.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadedFilesTable items={uploadedFiles} />
            </CardContent>
          </Card>
        )}
      </EntityForm>
    </div>
  )
}

export default CreateOrganizationForm
