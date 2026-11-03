"use client"

import type { ReactNode } from "react"
import type { SubmitHandler, UseFormReturn } from "react-hook-form"

import { Button } from "@nexora/ui/components/button"
import { Field, FieldGroup } from "@nexora/ui/components/field"
import { SignUpFormFields } from "./sign-up-form-fields"
import type { SignUpFormValues } from "@nexora/schemas/auth/sign-up"

interface SignUpFormProps {
  form: UseFormReturn<SignUpFormValues>
  onSubmit: SubmitHandler<SignUpFormValues>
  isSubmitting?: boolean
  labels?: Partial<Record<keyof SignUpFormValues, string>>
  submitLabel?: string
  footer?: ReactNode
}

export const SignUpForm = ({
  form,
  onSubmit,
  isSubmitting = false,
  labels,
  submitLabel = "Create account",
  footer,
}: SignUpFormProps) => {
  const isPending = isSubmitting || form.formState.isSubmitting

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <SignUpFormFields form={form} labels={labels} />
        <Field>
          <Button
            type="submit"
            className="rounded-none p-5 text-xs"
            disabled={isPending}
            fullWidth
            arrow="right"
          >
            {submitLabel}
          </Button>
        </Field>
        {footer}
      </FieldGroup>
    </form>
  )
}
