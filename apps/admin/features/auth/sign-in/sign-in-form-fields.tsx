"use client"

import { useId } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@nexora/ui/components/field"
import { Input } from "@nexora/ui/components/input"
import type { SignInFormValues } from "@nexora/schemas/auth/sign-in"

const signInFields = [
  {
    name: "identifier",
    label: "Email or username",
    type: "text",
    autoComplete: "username",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "current-password",
  },
] as const satisfies ReadonlyArray<{
  name: keyof SignInFormValues
  label: string
  type: string
  autoComplete: string
}>

interface SignInFormFieldsProps {
  form: UseFormReturn<SignInFormValues>
  labels?: Partial<Record<keyof SignInFormValues, string>>
}

export const SignInFormFields = ({ form, labels }: SignInFormFieldsProps) => {
  const id = useId()

  return (
    <FieldGroup>
      {signInFields.map(({ name, label, type, autoComplete }) => {
        const inputId = `${id}-${name}`
        const errorId = `${inputId}-error`

        return (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                data-disabled={field.disabled || form.formState.isSubmitting}
              >
                <FieldLabel htmlFor={inputId}>
                  {labels?.[name] ?? label}
                </FieldLabel>
                <Input
                  {...field}
                  id={inputId}
                  value={field.value ?? ""}
                  type={type}
                  autoComplete={autoComplete}
                  autoCapitalize={name === "identifier" ? "none" : undefined}
                  spellCheck={name === "identifier" ? false : undefined}
                  required
                  disabled={field.disabled || form.formState.isSubmitting}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? errorId : undefined}
                />
                {fieldState.error && (
                  <FieldError id={errorId} errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )
      })}
    </FieldGroup>
  )
}
