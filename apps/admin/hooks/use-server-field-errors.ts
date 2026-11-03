"use client"

import type { ApiFieldError } from "@nexora/shared/types/api"
import { useTranslations } from "next-intl"
import { useCallback } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

/**
 * Marks the fields a VALIDATION_ERROR response names. Services validate
 * without translated messages, so their English text is never shown; the
 * field gets a generic message in the page's language instead, and the toast
 * explains the rest.
 */
export function useServerFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>
) {
  const t = useTranslations("common.form")

  return useCallback(
    (errors: ApiFieldError[] | undefined) => {
      const values = form.getValues()

      errors?.forEach(({ field }) => {
        if (field in values) {
          form.setError(field as Path<T>, {
            type: "server",
            message: t("invalidField"),
          })
        }
      })
    },
    [form, t]
  )
}
