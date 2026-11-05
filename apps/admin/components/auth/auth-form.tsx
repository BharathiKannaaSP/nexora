"use client"

import { useId, type InputHTMLAttributes } from "react"
import {
  Controller,
  type FieldValues,
  type Path,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form"

import { Button } from "@nexora/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@nexora/ui/components/field"
import { Input } from "@nexora/ui/components/input"

/** One required input of an AuthForm; its label comes from `labels`. */
export interface AuthFieldDef<TValues extends FieldValues> {
  name: Path<TValues>
  type: "text" | "email" | "password"
  autoComplete: string
  /** On the field's wrapper, e.g. "sm:col-span-2". */
  className?: string
  inputProps?: InputHTMLAttributes<HTMLInputElement>
}

interface AuthFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>
  onSubmit: SubmitHandler<TValues>
  fields: readonly AuthFieldDef<TValues>[]
  labels: Record<AuthFieldDef<TValues>["name"], string>
  submitLabel: string
  /** On the fields' group, e.g. a two-column grid. */
  fieldsClassName?: string
}

/** The sign-in and sign-up forms: a column of inputs and a submit button. */
export function AuthForm<TValues extends FieldValues>({
  form,
  onSubmit,
  fields,
  labels,
  submitLabel,
  fieldsClassName,
}: AuthFormProps<TValues>) {
  const id = useId()
  const { isSubmitting } = form.formState

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <FieldGroup className={fieldsClassName}>
          {fields.map(({ name, type, autoComplete, className, inputProps }) => {
            const inputId = `${id}-${name}`
            const errorId = `${inputId}-error`

            return (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    className={className}
                    data-invalid={fieldState.invalid}
                    data-disabled={field.disabled || isSubmitting}
                  >
                    <FieldLabel htmlFor={inputId}>{labels[name]}</FieldLabel>
                    <Input
                      {...field}
                      {...inputProps}
                      id={inputId}
                      value={field.value ?? ""}
                      type={type}
                      autoComplete={autoComplete}
                      required
                      disabled={field.disabled || isSubmitting}
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
        <Field>
          <Button
            type="submit"
            className="rounded-none p-5 text-xs"
            disabled={isSubmitting}
            fullWidth
            arrow="right"
          >
            {submitLabel}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
