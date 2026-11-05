"use client"
import type { ApiResult } from "@/lib/api/result"
import type {
  AdminAccessRequest,
  BecomeAdminFormDetailsResponseData,
} from "@nexora/shared/types/onboarding"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
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
import {
  createBecomeAdminFormConfig,
  createBecomeAdminFormSchema,
} from "./become-admin-form-config"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type {
  BecomeAdminFormValues,
  PermissionAction,
  PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import type { Country } from "@nexora/shared/types/country"
import type { Country as PhoneCountry } from "react-phone-number-input"
import { EntityForm } from "@/components/forms/entity-form"
import { updateMe } from "@/lib/api/auth/update-me"
import { submitBecomeAdminRequest } from "@/lib/api/onboarding/submit-become-admin-request"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { updateUserDetails } from "@/lib/api/user-service/user-details-update"
import {
  ONBOARDING_PATHS,
  ROLE_REQUIREMENTS_PATHS,
} from "@/lib/bootstrap/bootstrap-path"
import {
  getCountryDefaultLanguage,
  href,
  isCountryLanguage,
} from "@/lib/i18n/config"
import { getBecomeAdminFormDetails } from "@/lib/api/onboarding/become-admin-get"

/**
 * The countries and permissions of a saved request, in the form's shape:
 * one row per country, module and action becomes
 * { [country]: { [module]: action[] } }. The locked country is always ticked.
 */
const savedFormSelections = (
  savedRequest: AdminAccessRequest | null,
  lockedCountryCode: string | undefined
): Pick<BecomeAdminFormValues, "countries" | "permissions"> => {
  const permissions: BecomeAdminFormValues["permissions"] = {}

  for (const {
    countryCode,
    moduleCode,
    accessLevel,
  } of savedRequest?.requestedPermissions ?? []) {
    const modules = (permissions[countryCode] ??= {})
    const actions = (modules[moduleCode as PermissionModuleCode] ??= [])
    actions.push(accessLevel as PermissionAction)
  }

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

  const { country: urlCountry, lang } = useParams<{
    country: string
    lang: string
  }>()

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

  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  )

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

  const handlePreviousStep = async () => {
    const stepResult = await updateOnboardingStep({
      step: "CHOOSE_PATH",
    })
    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }
    router.replace(href(urlCountry, lang, ONBOARDING_PATHS.CHOOSE_PATH))
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
