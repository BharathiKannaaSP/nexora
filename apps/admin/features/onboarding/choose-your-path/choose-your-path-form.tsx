"use client"
import { useBootstrap } from "@/features/bootstrap/bootstrap-provider"
import { useApiToast } from "@/hooks/use-api-toast"
import { useServerFieldErrors } from "@/hooks/use-server-field-errors"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import React, { useEffect, useMemo } from "react"
import {
  createChooseYourPathFormConfig,
  createChooseYourPathFormSchema,
} from "./choose-your-path-form-config"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { ChooseYourPathFormValues } from "@nexora/schemas/onboarding/choose-your-path"
import type { Country } from "@nexora/shared/types/country"
import type { Country as PhoneCountry } from "react-phone-number-input"
import { EntityForm } from "@/components/forms/entity-form"
import { updateMe } from "@/lib/api/auth/update-me"
import { updateOnboardingStep } from "@/lib/api/auth/update-onboarding-step"
import { updateUserDetails } from "@/lib/api/user-service/user-details-update"
import {
  ONBOARDING_PATHS,
  ROLE_REQUIREMENTS_PATHS,
} from "@/lib/bootstrap/bootstrap-path"
import {
  getCountryDefaultLanguage,
  href,
  isCountry,
  isCountryLanguage,
} from "@/lib/i18n/config"

/**
 * The /country the app should move to for the picked bioCountry: one Nexora
 * is offered in and that differs from the current URL. Null otherwise, e.g.
 * for India while on /in, or for Brazil, which has no /br.
 */
const getCountrySwitch = (bioCountry: string, urlCountry: string) => {
  const target = bioCountry.toLowerCase()
  return isCountry(target) && target !== urlCountry ? target : null
}

interface ChooseYourPathFormProps {
  countries: Country[]
}

const ChooseYourPathForm = ({ countries }: ChooseYourPathFormProps) => {
  const t = useTranslations("onboarding")
  const tActions = useTranslations("common.actions")
  const showApiToast = useApiToast()
  const router = useRouter()
  const { user, onboarding } = useBootstrap()
  const { country: urlCountry, lang } = useParams<{
    country: string
    lang: string
  }>()

  const schema = createChooseYourPathFormSchema(t)

  // A saved country wins if it can still be picked; otherwise start from the
  // URL's (/fr → France), with its first time zone and default language, as
  // if it had been picked. Uppercased because older profiles saved lowercase
  // codes ("uy").
  const savedCode = user?.bioCountry?.toUpperCase()
  const savedCountry = countries.find(({ code }) => code === savedCode)
  const hasSavedCountry = Boolean(savedCountry)
  const initialCountry =
    savedCountry ??
    countries.find(({ code }) => code === urlCountry.toUpperCase())

  const form = useForm<ChooseYourPathFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      selectedPath: onboarding?.selectedPath ?? "BECOME_ADMIN",
      phoneNumber: user?.phoneNumber ?? "",
      dob: user?.dob?.slice(0, 10) ?? "",
      gender: user?.gender ?? undefined,
      bioCountry: initialCountry?.code ?? "",
      bio: user?.bio ?? "",
      addressLine1: user?.addressLine1 ?? "",
      addressLine2: user?.addressLine2 ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      postalCode: user?.postalCode ?? "",
      languageCode: hasSavedCountry
        ? (user?.languageCode ?? "en")
        : initialCountry
          ? getCountryDefaultLanguage(initialCountry.code.toLowerCase())
          : (user?.languageCode ?? "en"),
      timeZone: hasSavedCountry
        ? (user?.timezone ?? "")
        : (initialCountry?.timezones[0] ?? ""),
    },
  })
  const applyServerFieldErrors = useServerFieldErrors(form)

  const bioCountry = useWatch({ control: form.control, name: "bioCountry" })
  const selectedCountry = countries.find(({ code }) => code === bioCountry)

  // A new country invalidates the phone number (its calling code), time zone
  // and language; the latter two default to the country's first zone and its
  // default language. watch's callback only runs on changes, not for the
  // default values.
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name !== "bioCountry") return

      const country = countries.find(({ code }) => code === values.bioCountry)

      form.setValue("phoneNumber", "")
      form.setValue("timeZone", country?.timezones[0] ?? "")
      form.setValue(
        "languageCode",
        country ? getCountryDefaultLanguage(country.code.toLowerCase()) : ""
      )
    })

    return () => subscription.unsubscribe()
  }, [form, countries])

  // Picking a country Nexora is offered in, other than the URL's, moves the
  // app there after saving; the notice says so up front. Names are in the
  // page's language, e.g. "Inde" on /fr/fr.

  const countrySwitch = getCountrySwitch(bioCountry, urlCountry)
  const regionNames = useMemo(
    () => new Intl.DisplayNames([lang], { type: "region" }),
    [lang]
  )
  const countrySwitchNotice = countrySwitch
    ? t("chooseYourPathForm.hints.countrySwitch", {
        current: regionNames.of(urlCountry.toUpperCase()) ?? urlCountry,
        next: regionNames.of(countrySwitch.toUpperCase()) ?? countrySwitch,
      })
    : undefined

  const config = createChooseYourPathFormConfig({
    t,
    countries,
    urlCountry,
    selectedCountry,
    countrySwitchNotice,
    lang,
    regionNames,
  })

  const handleSubmit = async (values: ChooseYourPathFormValues) => {
    const { selectedPath, ...userDetails } = values

    const result = await updateUserDetails(userDetails)
    showApiToast(result)

    if (!result.success) {
      applyServerFieldErrors(result.errors)
      return
    }

    // Saves the path and moves past this step in one call.
    const stepResult = await updateOnboardingStep({
      step: "ROLE_REQUIREMENTS",
      selectedPath,
    })
    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }

    // The app follows the picked country (when Nexora is offered there) and
    // the picked language (when the app is translated into it for that
    // country), e.g. /fr/en + India + Tamil → /in/ta. Otherwise the URL's
    // language is kept if the country offers it (/fr/en → /in/en), or the
    // country's default is used (/fr/fr → /in/en).
    const targetCountry =
      getCountrySwitch(values.bioCountry, urlCountry) ?? urlCountry
    const pickedLang = values.languageCode ?? ""
    const targetLang = isCountryLanguage(targetCountry, pickedLang)
      ? pickedLang
      : isCountryLanguage(targetCountry, lang)
        ? lang
        : getCountryDefaultLanguage(targetCountry)

    if (targetCountry === urlCountry && targetLang === lang) {
      // Re-run the page's BootstrapGuard so it moves on once onboarding has.
      router.refresh()
      return
    }

    // Saved on the account so the next sign-in opens there too. The profile
    // and step are already saved, so a failure here only costs that.
    const preferenceResult = await updateMe({
      countryCode: targetCountry,
      preferredLocale: targetLang,
    })

    if (!preferenceResult.success) {
      showApiToast(preferenceResult)
    }

    router.replace(
      href(targetCountry, targetLang, ROLE_REQUIREMENTS_PATHS[selectedPath])
    )
  }

  const handlePreviousStep = async () => {
    const stepResult = await updateOnboardingStep({
      step: "BASIC_INFORMATION",
    })
    if (!stepResult.success) {
      showApiToast(stepResult)
      return
    }
    router.replace(href(urlCountry, lang, ONBOARDING_PATHS.BASIC_INFORMATION))
  }

  return (
    <EntityForm
      form={form}
      config={config}
      countryCode={selectedCountry?.code as PhoneCountry | undefined}
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
  )
}

export default ChooseYourPathForm
