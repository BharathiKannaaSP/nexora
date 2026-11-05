import React from "react"
import { Controller, FieldValues, Path, UseFormReturn } from "react-hook-form"
import { Button } from "@nexora/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@nexora/ui/components/card"
import { FieldGroup } from "@nexora/ui/components/field"
import { cn } from "@nexora/ui/lib/utils"
import { RenderField } from "./render-field"
import { EntityFormConfig } from "./form-types"
import { Spinner } from "@nexora/ui/components/spinner"
import { Country } from "react-phone-number-input"
import { useTranslations } from "next-intl"

export type EntityFormAction = {
  key: string
  label: string
  variant?:
    "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  type?: "button" | "submit"
  disabled?: boolean
  loading?: boolean
  onClick?: () => void | Promise<void>
}

// "previous" and "previous" sit on the left of the footer, the rest on the right.
const isLeftAction = (action: EntityFormAction) =>
  action.key === "previous" || action.key === "previous"

interface EntityFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>
  config: EntityFormConfig
  initialData?: Partial<TValues>
  onSubmit: (values: TValues) => Promise<void>
  isSubmitting?: boolean
  actions?: EntityFormAction[]
  countryCode?: Country
  /** Shown after the sections, above the footer, e.g. an uploaded-files table. */
  children?: React.ReactNode
}

export function EntityForm<TValues extends FieldValues>({
  form,
  config,
  onSubmit,
  actions = [],
  countryCode,
  children,
}: EntityFormProps<TValues>) {
  const tCommon = useTranslations("common")
  async function handleSubmit(values: TValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      console.error(err)
    }
  }

  function getField(name: string) {
    return config.fields.find((field) => field.name === name)
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      {config.title && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-bold tracking-tight">{config.title}</h1>

            {config.description && (
              <p className="hidden text-xs text-muted-foreground md:block">
                {config.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* SECTIONS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        {config.sections.map((section) => (
          <Card
            key={section.title}
            className={cn(
              "rounded-sm shadow-sm",
              section.isLastField && "col-span-full"
            )}
          >
            <CardHeader className="flex items-center gap-2">
              {section.icon ? (
                <div className="rounded-sm bg-background/40 p-4">
                  <section.icon />{" "}
                </div>
              ) : null}

              <div>
                <CardTitle>{section.title}</CardTitle>

                {section.description && (
                  <CardDescription className="text-xs">
                    {section.description}
                  </CardDescription>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <FieldGroup
                className={cn(
                  "grid grid-cols-1 gap-6 md:grid-cols-2",
                  section.columns === 4 && "lg:grid-cols-4"
                )}
              >
                {section.fields.map((name) => {
                  const fieldConfig = getField(name)

                  if (!fieldConfig) {
                    return null
                  }

                  return (
                    <Controller
                      key={fieldConfig.name}
                      name={fieldConfig.name as Path<TValues>}
                      control={form.control}
                      // defaultValue={fieldConfig.defaultValue ?? ""}
                      render={({ field, fieldState }) => (
                        <RenderField
                          fieldConfig={fieldConfig}
                          field={field}
                          error={fieldState.error}
                          countryCode={countryCode}
                        />
                      )}
                    />
                  )
                })}
              </FieldGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {children}

      {/* FOOTER ACTIONS */}
      {actions.length > 0 && (
        <div className="sticky bottom-2 z-20 flex items-center justify-between rounded-2xl border bg-background/60 p-4 backdrop-blur">
          {/* Left Actions */}
          <div className="flex items-center gap-3">
            {actions.filter(isLeftAction).map((action) => (
              <Button
                key={action.key}
                type={action.type ?? "button"}
                variant={action.variant ?? "default"}
                disabled={action.disabled || action.loading}
                onClick={
                  action.type === "submit"
                    ? form.handleSubmit(handleSubmit)
                    : action.onClick
                }
              >
                {action.loading ? (
                  <Spinner aria-label={tCommon("loading")} />
                ) : (
                  action.label
                )}
              </Button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {actions
              .filter((action) => !isLeftAction(action))
              .map((action) => (
                <Button
                  key={action.key}
                  type={action.type ?? "button"}
                  variant={action.variant ?? "default"}
                  disabled={action.disabled || action.loading}
                  onClick={
                    action.type === "submit"
                      ? form.handleSubmit(handleSubmit)
                      : action.onClick
                  }
                >
                  {action.loading ? (
                    <Spinner aria-label={tCommon("loading")} />
                  ) : (
                    action.label
                  )}
                </Button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
