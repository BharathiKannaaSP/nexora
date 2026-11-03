"use client"

import type { ReactNode } from "react"
import type { SubmitHandler, UseFormReturn } from "react-hook-form"

import { Button } from "@nexora/ui/components/button"
import { Field, FieldGroup } from "@nexora/ui/components/field"
import { SignInFormFields } from "./sign-in-form-fields"
import type { SignInFormValues } from "@nexora/schemas/auth/sign-in"

interface SignInFormProps {
  form: UseFormReturn<SignInFormValues>
  onSubmit: SubmitHandler<SignInFormValues>
  isSubmitting?: boolean
  labels?: Partial<Record<keyof SignInFormValues, string>>
  submitLabel?: string
  footer?: ReactNode
}

export const SignInForm = ({
  form,
  onSubmit,
  isSubmitting = false,
  labels,
  submitLabel = "Sign in",
  footer,
}: SignInFormProps) => {
  const isPending = isSubmitting || form.formState.isSubmitting

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <SignInFormFields form={form} labels={labels} />
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
