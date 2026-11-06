"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useWatch, type FieldPath } from "react-hook-form"

import { isSavedFile } from "@nexora/schemas/onboarding/create-organization"
import {
  joinDocumentRulesFor,
  type JoinDocumentSlot,
  type JoinOrganizationFormValues,
} from "@nexora/schemas/onboarding/join-organization"
import type { JoinOrganizationFormDetailsResponseData } from "@nexora/shared/types/onboarding"
import type {
  OrganizationDirectoryEntry,
  OrganizationDirectoryResponseData,
} from "@nexora/shared/types/organization"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"

import { EntityForm } from "@/components/forms/entity-form"
import { UploadedFilesTable } from "@/components/forms/uploaded-files-table"
import { OrganizationPicker } from "@/components/organization/organization-picker"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useApiToast } from "@/hooks/use-api-toast"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { useRegionNames } from "@/hooks/use-region-names"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { deleteUpload } from "@/lib/api/media/delete-upload"
import { removeOrganizationRequestFile } from "@/lib/api/onboarding/remove-organization-request-file"
import { submitJoinOrganizationRequest } from "@/lib/api/onboarding/submit-join-organization-request"
import { searchOrganizations } from "@/lib/api/organization/search-organizations"
import type { ApiResult } from "@/lib/api/result"
import { uploadIfNew, type UploadedFile } from "@/lib/media/upload-file"

import { usePreviousStep } from "../use-previous-step"
import { JoinOrganizationAside } from "./join-organization-aside"
import {
  createJoinOrganizationFormSchema,
  documentLabelKey,
  joinOrganizationFormConfig,
  organizationIndustryName,
} from "./join-organization-form-config"
import { toJoinOrganizationFormDefaults } from "./join-organization-form-defaults"

// How long typing pauses before the directory is searched.
const SEARCH_DEBOUNCE_MS = 300

interface JoinOrganizationFormProps {
  joinOrganizationFormDetails: ApiResult<JoinOrganizationFormDetailsResponseData>
  /** The directory's first page, before anything is searched. */
  directory: ApiResult<OrganizationDirectoryResponseData>
  /** The saved request's organization, when there is one. */
  savedOrganization: OrganizationDirectoryEntry | null
}

const JoinOrganizationForm = ({
  joinOrganizationFormDetails,
  directory,
  savedOrganization,
}: JoinOrganizationFormProps) => {
  const t = useTranslations("onboarding")
  const tActions = useTranslations("common.actions")
  const { user } = useBootstrap()
  const { country: urlCountry, lang } = useLocaleParams()
  const showApiToast = useApiToast()
  const router = useRouter()
  const regionNames = useRegionNames(lang)

  const schema = useMemo(() => createJoinOrganizationFormSchema(t), [t])

  // The documents follow the user's own country, else the URL's.
  const documentCountryCode = (user?.bioCountry || urlCountry).toUpperCase()
  const documentRules = joinDocumentRulesFor(documentCountryCode)
  const countryName = (code: string) => regionNames.of(code) ?? code
  const industryName = (industry: string) =>
    organizationIndustryName(t, industry)

  // The saved request, when the user comes back to step 3; else null.
  const savedRequest = joinOrganizationFormDetails.success
    ? joinOrganizationFormDetails.data.joinOrganizationFormDetails
    : null

  const form = useForm<JoinOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...toJoinOrganizationFormDefaults(savedRequest, documentCountryCode),
      // An organization that's left the directory has to be picked again.
      organizationId: savedOrganization?.id ?? "",
    },
  })

  const applyServerFieldErrors = useServerFieldErrors(form)

  // Organization search: the latest results, and the picked organization,
  // which stays on show even when a search leaves it out.
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<OrganizationDirectoryEntry[]>(
    directory.success ? directory.data.organizations : []
  )
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationDirectoryEntry | null>(savedOrganization)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Only the newest search may set the results; older ones can land later.
  const latestSearch = useRef(0)

  useEffect(() => () => clearTimeout(searchTimer.current), [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setSearching(true)
    clearTimeout(searchTimer.current)

    searchTimer.current = setTimeout(async () => {
      const searchId = ++latestSearch.current
      const result = await searchOrganizations({ search: value })
      if (searchId !== latestSearch.current) return

      setSearching(false)
      if (result.success) setResults(result.data.organizations)
      else showApiToast(result)
    }, SEARCH_DEBOUNCE_MS)
  }

  const shownOrganizations =
    selectedOrganization &&
    !results.some(({ id }) => id === selectedOrganization.id)
      ? [selectedOrganization, ...results]
      : results

  // The picked (or saved) documents, listed under the upload cards.
  const documentValues = useWatch({
    control: form.control,
    name: "proposedDocuments",
  })

  /**
   * Deletes a saved document for good, from the X on its upload card or the
   * table's Delete. It's taken off the saved request first, then deleted
   * from S3, so the request never points at a missing file and a refresh
   * doesn't bring it back. Resolves true once it's off the request.
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
  const removeFile = (name: FieldPath<JoinOrganizationFormValues>) => () =>
    // null, not undefined: undefined would bring back the saved default.
    form.setValue(name, null as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: form.formState.isSubmitted,
    })

  const uploadedFiles = documentRules.map((rule) => ({
    id: rule.slot,
    label: t(`joinOrganizationForm.documents.${documentLabelKey(rule)}.label`),
    value: documentValues?.[rule.slot],
    onRemove: removeFile(`proposedDocuments.${rule.slot}`),
    onDeleteSavedFile: deleteSavedFile,
  }))
  const hasUploadedFiles = uploadedFiles.some(({ value }) => value)

  const config = joinOrganizationFormConfig({
    t,
    documentRules,
    documentCountryName: countryName(documentCountryCode),
    onDeleteSavedFile: deleteSavedFile,
    renderOrganizationPicker: ({ field, labelId, describedBy, invalid }) => (
      <OrganizationPicker
        organizations={shownOrganizations}
        value={field.value}
        onValueChange={(organization) => {
          setSelectedOrganization(organization)
          field.onChange(organization.id)
        }}
        search={search}
        onSearchChange={handleSearchChange}
        searching={searching}
        countryName={countryName}
        industryName={industryName}
        inputRef={field.ref}
        onBlur={field.onBlur}
        labelId={labelId}
        describedBy={describedBy}
        invalid={invalid}
      />
    ),
  })

  // Step 3 goes back to step 2, where the path was picked.
  const handlePreviousStep = usePreviousStep("CHOOSE_PATH")

  /**
   * Uploads newly picked documents straight to S3 (saved ones are kept as
   * they are), then submits the request with their keys. The request also
   * moves onboarding on to REVIEW.
   */
  const handleSubmit = async (values: JoinOrganizationFormValues) => {
    // Parsed again for the schema's output type: trimmed, enums narrowed.
    const { proposedDocuments, ...fields } = schema.parse(values)

    const documentSlots = (
      Object.keys(proposedDocuments) as JoinDocumentSlot[]
    ).filter((slot) => proposedDocuments[slot])

    // All at once; each upload is signed for its own file only.
    const documents = await Promise.all(
      documentSlots.map((slot) =>
        uploadIfNew(proposedDocuments[slot]!, "org-document")
      )
    )

    const uploadedDocuments: Partial<Record<JoinDocumentSlot, UploadedFile>> =
      {}

    for (const [i, slot] of documentSlots.entries()) {
      const document = documents[i]!
      if (!document.success) {
        showApiToast(document)
        return
      }
      uploadedDocuments[slot] = document.data
    }

    const result = await submitJoinOrganizationRequest({
      ...fields,
      type: "JOIN",
      proposedDocuments: uploadedDocuments,
    })

    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    // Saved documents the user deleted or replaced are no longer used by
    // the request now saved, so they can go. Done only now, so a request is
    // never left pointing at a missing file. A failure only leaves an unused
    // object behind, so it doesn't stop the user.
    const keptKeys = new Set(
      Object.values(uploadedDocuments).map(({ key }) => key)
    )
    const unusedKeys = (savedRequest?.proposedDocuments ?? [])
      .map(({ objectKey }) => objectKey)
      .filter((key) => !keptKeys.has(key))

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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
      <EntityForm
        form={form}
        config={config}
        onSubmit={handleSubmit}
        actions={[
          {
            key: "previous",
            label: tActions("back"),
            variant: "outline",
            onClick: () => handlePreviousStep(),
          },
          {
            key: "submitRequest",
            label: t("joinOrganizationForm.submit"),
            type: "submit",
            loading: form.formState.isSubmitting,
          },
        ]}
      >
        {hasUploadedFiles && (
          <Card className="rounded-sm shadow-sm">
            <CardHeader>
              <CardTitle>
                {t("joinOrganizationForm.uploadedFiles.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("joinOrganizationForm.uploadedFiles.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadedFilesTable items={uploadedFiles} />
            </CardContent>
          </Card>
        )}
      </EntityForm>

      <JoinOrganizationAside
        className="xl:sticky xl:top-20"
        organization={selectedOrganization}
        countryName={countryName}
        industryName={industryName}
        onChangeOrganization={() => form.setFocus("organizationId")}
      />
    </div>
  )
}

export default JoinOrganizationForm
