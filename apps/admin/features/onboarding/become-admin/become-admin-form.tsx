"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import type { BecomeAdminFormValues } from "@nexora/schemas/onboarding/become-admin"
import type { Country } from "@nexora/shared/types/country"
import type {
  AdminAccessRequest,
  BecomeAdminFormDetailsResponseData,
} from "@nexora/shared/types/onboarding"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@nexora/ui/components/alert-dialog"
import { Button } from "@nexora/ui/components/button"
import { Spinner } from "@nexora/ui/components/spinner"

import { EntityForm } from "@/components/forms/entity-form"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useApiToast } from "@/hooks/use-api-toast"
import { useLocaleParams } from "@/hooks/use-locale-params"
import { useRegionNames } from "@/hooks/use-region-names"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { submitBecomeAdminRequest } from "@/lib/api/onboarding/submit-become-admin-request"
import type { ApiResult } from "@/lib/api/result"
import { toCountryPermissions } from "@/lib/auth/permissions"

import { usePreviousStep } from "../use-previous-step"
import {
  createBecomeAdminFormConfig,
  createBecomeAdminFormSchema,
} from "./become-admin-form-config"

/**
 * The countries and permissions of a saved request, in the form's shape
 * (see toCountryPermissions()). The locked country is always ticked.
 */
const savedFormSelections = (
  savedRequest: AdminAccessRequest | null,
  lockedCountryCode: string | undefined
): Pick<BecomeAdminFormValues, "countries" | "permissions"> => {
  const permissions = toCountryPermissions(
    savedRequest?.requestedPermissions ?? []
  )

  const countries = [
    ...new Set([
      ...(lockedCountryCode ? [lockedCountryCode] : []),
      ...Object.keys(permissions),
    ]),
  ]

  return { countries, permissions }
}

interface BecomeAdminFormProps {
  countries: Country[]
  becomeAdminFormDetails: ApiResult<BecomeAdminFormDetailsResponseData>
}

const BecomeAdminForm = ({
  countries,
  becomeAdminFormDetails,
}: BecomeAdminFormProps) => {
  const t = useTranslations("onboarding")
  const tActions = useTranslations("common.actions")
  const tCommon = useTranslations("common")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { user } = useBootstrap()
  const { lang } = useLocaleParams()
  const handlePreviousStep = usePreviousStep("CHOOSE_PATH")

  const schema = createBecomeAdminFormSchema(t)

  // In selected country, definetely should be preselected and disabled.
  const userCountry = user?.bioCountry?.toUpperCase()

  const lockedCountryCode = countries.some(({ code }) => code === userCountry)
    ? userCountry
    : undefined

  // `data` only exists on a successful result; a failed fetch starts blank.
  const savedRequest = becomeAdminFormDetails.success
    ? becomeAdminFormDetails.data.adminAccessRequest
    : null

  const form = useForm<BecomeAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobTitle: savedRequest?.jobTitle ?? "",
      department: savedRequest?.department ?? "",
      currentOrganizationName: savedRequest?.currentOrganizationName ?? "",
      justification: savedRequest?.justification ?? "",
      ...savedFormSelections(savedRequest, lockedCountryCode),
    },
  })

  const applyServerFieldErrors = useServerFieldErrors(form)

  const selectedCountryCodes = useWatch({
    control: form.control,
    name: "countries",
  })

  const regionNames = useRegionNames(lang)

  const config = createBecomeAdminFormConfig({
    t,
    countries,
    selectedCountryCodes,
    lockedCountryCode,
    lang,
    regionNames,
  })

  // Validated values waiting for the user to confirm; the dialog is open
  // while this is set.
  const [pendingValues, setPendingValues] =
    useState<BecomeAdminFormValues | null>(null)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  const handleSubmit = async (values: BecomeAdminFormValues) => {
    setPendingValues(values)
  }

  const handleConfirmSubmit = async () => {
    if (!pendingValues) return

    setIsSubmittingRequest(true)
    const result = await submitBecomeAdminRequest(pendingValues)
    setIsSubmittingRequest(false)
    showApiToast(result)

    if (!result.success) {
      // Close so the user can see and fix the field errors.
      setPendingValues(null)
      applyServerFieldErrors(result.errors)
      return
    }

    // The request also moved onboarding to REVIEW; re-run the page's
    // BootstrapGuard so it sends the user there.
    router.refresh()
  }

  return (
    <>
      <EntityForm
        form={form}
        config={config}
        onSubmit={handleSubmit}
        actions={[
          {
            key: "previous",
            label: tActions("previous"),
            variant: "outline",
            onClick: () => handlePreviousStep(),
          },
          {
            key: "submitRequest",
            label: tActions("submit"),
            type: "submit",
            loading: isSubmittingRequest,
          },
        ]}
      />

      <AlertDialog
        open={pendingValues !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmittingRequest) setPendingValues(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("becomeAdminForm.confirmSubmit.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("becomeAdminForm.confirmSubmit.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose disabled={isSubmittingRequest}>
              {tActions("cancel")}
            </AlertDialogClose>
            <Button
              disabled={isSubmittingRequest}
              onClick={() => handleConfirmSubmit()}
            >
              {isSubmittingRequest ? (
                <Spinner aria-label={tCommon("loading")} />
              ) : (
                tActions("submit")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default BecomeAdminForm
