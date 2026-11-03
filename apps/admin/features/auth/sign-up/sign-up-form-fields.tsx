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
import type { SignUpFormValues } from "@nexora/schemas/auth/sign-up"

const signUpFields = [
  {
    name: "firstName",
    label: "First name",
    type: "text",
    autoComplete: "given-name",
  },
  {
    name: "lastName",
    label: "Last name",
    type: "text",
    autoComplete: "family-name",
  },
  {
    name: "userName",
    label: "Username",
    type: "text",
    autoComplete: "userName",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
  },
] as const satisfies ReadonlyArray<{
  name: keyof SignUpFormValues
  label: string
  type: string
  autoComplete: string
}>

interface SignUpFormFieldsProps {
  form: UseFormReturn<SignUpFormValues>
  labels?: Partial<Record<keyof SignUpFormValues, string>>
}

export const SignUpFormFields = ({ form, labels }: SignUpFormFieldsProps) => {
  const id = useId()

  return (
    <FieldGroup className="grid grid-cols-1 sm:grid-cols-2">
      {signUpFields.map(({ name, label, type, autoComplete }) => {
        const inputId = `${id}-${name}`
        const errorId = `${inputId}-error`

        return (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                className={
                  name === "firstName" || name === "lastName"
                    ? undefined
                    : "sm:col-span-2"
                }
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
