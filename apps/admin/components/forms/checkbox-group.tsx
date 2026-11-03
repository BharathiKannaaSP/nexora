import { Checkbox } from "@nexora/ui/components/checkbox"
import { cn } from "@nexora/ui/lib/utils"
import { memo, useMemo } from "react"
import { ControllerRenderProps } from "react-hook-form"
import { flattenSelectOptions } from "./form-utils"
import { FieldConfig } from "./form-types"

/**
 * A card per option; the value is the ticked options' values, in the order
 * they were ticked. Once `maxItems` are ticked the rest can't be, and
 * disabled options keep whatever they start with.
 */
export const CheckboxGroupField = memo(function CheckboxGroupField({
  field,
  fieldConfig,
  labelId,
  describedBy,
  invalid,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
  fieldConfig: FieldConfig
  labelId: string
  describedBy?: string
  invalid?: boolean
}) {
  const options = useMemo(
    () => flattenSelectOptions(fieldConfig.options),
    [fieldConfig.options]
  )
  const value: string[] = field.value ?? []
  const isFull =
    fieldConfig.maxItems !== undefined && value.length >= fieldConfig.maxItems

  const toggle = (optionValue: string, checked: boolean) =>
    field.onChange(
      checked
        ? [...value, optionValue]
        : value.filter((item) => item !== optionValue)
    )

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className={cn(
        "grid gap-3",
        fieldConfig.direction === "column"
          ? "grid-cols-1"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      )}
    >
      {options.map((option) => {
        const id = `${fieldConfig.name}-${option.value}`
        const checked = value.includes(option.value)
        const disabled =
          fieldConfig.disabled || option.disabled || (isFull && !checked)

        return (
          <label
            key={option.value}
            htmlFor={id}
            data-checked={checked || undefined}
            data-disabled={disabled || undefined}
            className="flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50 data-checked:border-primary data-checked:bg-primary/5 data-disabled:cursor-not-allowed data-disabled:opacity-60"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">
                {option.label}
              </span>
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>
            <Checkbox
              id={id}
              checked={checked}
              disabled={disabled}
              aria-invalid={invalid || undefined}
              onCheckedChange={(next) => toggle(option.value, next)}
            />
          </label>
        )
      })}
    </div>
  )
})
