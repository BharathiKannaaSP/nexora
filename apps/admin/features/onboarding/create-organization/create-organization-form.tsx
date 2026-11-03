"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  toOrganizationSlug,
  type CreateOrganizationFormValues,
} from "@nexora/schemas/organization/create-organization"
import type { Country } from "@nexora/shared/types/country"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import {
  createCreateOrganizationFormSchema,
  createOrganizationFormConfig,
} from "./create-organization-form-config"
import { EntityForm } from "@/components/forms/entity-form"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { useApiToast } from "@/hooks/use-api-toast"
import { href } from "@/lib/i18n/config"
import { ONBOARDING_PATHS } from "@/lib/bootstrap/bootstrap-path"

interface CreateOrganizationFormProps {
  countries: Country[]
}

const CreateOrganizationForm = ({ countries }: CreateOrganizationFormProps) => {
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

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      proposedName: "",
      proposedSlug: toOrganizationSlug(""),
      proposedDescription: "",
      proposedCountryCode: initialCountry?.code ?? "",
      proposedIndustry: undefined,
      proposedSize: undefined,
      proposedWebsite: "",
      proposedTaxDetails: { taxId: "" },
      proposedAddress: {
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
      },
      proposedLogo: undefined,
    },
  })

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

  // Not sent anywhere yet: the organization request backend is being redone.
  const handleSubmit = async (values: CreateOrganizationFormValues) => {
    // Parsed again for the schema's output type: trimmed, enums narrowed.
    console.log("Create organization form", schema.parse(values))
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
      />
    </div>
  )
}

export default CreateOrganizationForm
