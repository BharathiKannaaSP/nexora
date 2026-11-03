"use client"
import { ControllerRenderProps } from "react-hook-form"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@nexora/ui/components/field"
import { Input } from "@nexora/ui/components/input"
import { DatePicker } from "@nexora/ui/components/date-picker"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@nexora/ui/components/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@nexora/ui/components/select"
import { RadioGroup, RadioGroupItem } from "@nexora/ui/components/radio-group"
import { Switch } from "@nexora/ui/components/switch"
import { Textarea } from "@nexora/ui/components/textarea"
import { cn } from "@nexora/ui/lib/utils"
import { MultiSelectField } from "./multi-select"
import { CheckboxGroupField } from "./checkbox-group"
import { ComboboxField } from "./combobox"
import { flattenSelectOptions } from "./form-utils"
import { FieldConfig } from "./form-types"
import PhoneInputInput, { Country } from "react-phone-number-input/input"
import FileUpload from "./file-upload"
import LinksInput from "./form-link-input"
import { useLocale } from "next-intl"
import { PermissionMatrixField } from "./permission-matrix"

interface RenderFieldProps {
  fieldConfig: FieldConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any
  countryCode?: string
}

export function RenderField({
  fieldConfig,
  field,
  error,
  countryCode,
}: RenderFieldProps) {
  const locale = useLocale()
  const Icon = fieldConfig.icon
  const isTextInput =
    fieldConfig.type === "text" ||
    fieldConfig.type === "email" ||
    fieldConfig.type === "password"

  // Ids that tie the visible label, description and error to the control,
  // so screen readers announce them when the control is focused.
  const inputId = `field-${fieldConfig.name}`
  const labelId = `${inputId}-label`
  const descriptionId = `${inputId}-description`
  const errorId = `${inputId}-error`
  const describedBy =
    [fieldConfig.description && descriptionId, error && errorId]
      .filter(Boolean)
      .join(" ") || undefined

  // Radio groups, checkbox groups, permission matrices and link lists have
  // several controls, so the label names the group (aria-labelledby) instead
  // of pointing at a single input.
  const isGroupField =
    fieldConfig.type === "radio-group" ||
    fieldConfig.type === "checkbox-group" ||
    fieldConfig.type === "permission-matrix" ||
    fieldConfig.type === "links"

  // The upload boxes show the description inside; compact cards also show
  // the label inside, so the one above stays for screen readers only.
  const uploadVariant =
    fieldConfig.type === "file-upload"
      ? (fieldConfig.uploadVariant ?? "dropzone")
      : undefined
  const descriptionInside = !!uploadVariant && uploadVariant !== "inline"
  const labelInside = uploadVariant === "compact"

  const a11yProps = {
    id: inputId,
    "aria-invalid": !!error,
    "aria-required": fieldConfig.required || undefined,
    "aria-describedby": describedBy,
  }

  if (fieldConfig.type === "switch") {
    return (
      <Field
        orientation="horizontal"
        className="items-center justify-between rounded border p-4"
        data-invalid={!!error}
        data-required={fieldConfig.required ? true : false}
        style={{ gridColumn: fieldConfig.colSpan === 2 ? "span 2" : undefined }}
      >
        <div className="space-y-1">
          <FieldLabel htmlFor={inputId}>{fieldConfig.label}</FieldLabel>
          {fieldConfig.description && (
            <FieldDescription id={descriptionId}>
              {fieldConfig.description}
            </FieldDescription>
          )}
        </div>

        <Switch
          {...a11yProps}
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </Field>
    )
  }

  return (
    <Field
      data-invalid={!!error}
      className={cn(fieldConfig.colSpan === 2 && "md:col-span-2")}
      aria-labelledby={isGroupField ? labelId : undefined}
    >
      <FieldLabel
        id={labelId}
        htmlFor={isGroupField ? undefined : inputId}
        className={cn(labelInside && "sr-only")}
      >
        {fieldConfig.label}
        {fieldConfig.required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLabel>

      {/* TEXT / EMAIL / PASSWORD */}
      {isTextInput &&
        (Icon || fieldConfig.endAdornment ? (
          <InputGroup>
            <InputGroupInput
              {...field}
              {...a11yProps}
              type={fieldConfig.type}
              value={field.value ?? ""}
              disabled={fieldConfig.disabled}
              placeholder={fieldConfig.placeholder}
              {...fieldConfig.inputProps}
            />
            {Icon && (
              <InputGroupAddon>
                <Icon />
              </InputGroupAddon>
            )}
            {fieldConfig.endAdornment && (
              <InputGroupAddon align="inline-end">
                {fieldConfig.endAdornment}
              </InputGroupAddon>
            )}
          </InputGroup>
        ) : (
          <Input
            {...field}
            {...a11yProps}
            type={fieldConfig.type}
            value={field.value ?? ""}
            disabled={fieldConfig.disabled}
            placeholder={fieldConfig.placeholder}
            {...fieldConfig.inputProps}
          />
        ))}

      {/* TEXTAREA */}
      {fieldConfig.type === "textarea" && (
        <Textarea
          {...field}
          {...a11yProps}
          value={field.value ?? ""}
          disabled={fieldConfig.disabled}
          placeholder={fieldConfig.placeholder}
          className="min-h-28"
        />
      )}

      {/* SELECT */}
      {fieldConfig.type === "select" && (
        <Select
          disabled={fieldConfig.disabled}
          value={field.value || ""}
          onValueChange={field.onChange}
          // Lets SelectValue show the picked option's label, not its value.
          items={flattenSelectOptions(fieldConfig.options)}
        >
          <SelectTrigger className="w-full" {...a11yProps}>
            <SelectValue placeholder={fieldConfig.placeholder} />
          </SelectTrigger>

          <SelectContent>
            {fieldConfig.options?.map((option, index) => {
              // GROUPED OPTION
              if (
                typeof option === "object" &&
                option !== null &&
                "options" in option
              ) {
                const groupLabel =
                  "region" in option ? option.region : option.label

                return (
                  <SelectGroup key={`${groupLabel}-${index}`}>
                    <SelectLabel>{groupLabel}</SelectLabel>

                    {option.options.map((groupOption) => (
                      <SelectItem
                        key={groupOption.value}
                        value={groupOption.value}
                      >
                        {groupOption.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )
              }

              // NORMAL OPTION
              return (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}

      {/* COMBOBOX */}
      {fieldConfig.type === "combobox" && (
        <ComboboxField
          field={field}
          fieldConfig={fieldConfig}
          inputProps={a11yProps}
        />
      )}

      {/* MULTISELECT */}
      {fieldConfig.type === "multiselect" && (
        <MultiSelectField
          field={field}
          fieldConfig={fieldConfig}
          inputProps={a11yProps}
        />
      )}

      {/* // Radio Group */}
      {fieldConfig.type === "radio-group" && (
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          disabled={fieldConfig.disabled}
          aria-labelledby={labelId}
          defaultValue={fieldConfig.defaultValue}
          aria-describedby={describedBy}
          aria-required={fieldConfig.required || undefined}
          className="flex w-full flex-col gap-3 lg:flex-row"
        >
          {fieldConfig.options?.map((option) => {
            if (
              typeof option === "object" &&
              option !== null &&
              "value" in option
            ) {
              const id = `${fieldConfig.name}-${option.value}`
              const Icon = option.icon

              return (
                <FieldLabel key={option.value} htmlFor={id}>
                  <Field
                    orientation="horizontal"
                    className="h-30 cursor-pointer rounded-lg p-4 transition-colors hover:bg-muted/50"
                  >
                    <FieldContent>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                          {Icon && <Icon />}
                          <FieldTitle>{option.label}</FieldTitle>
                          <FieldDescription className="text-xs">
                            {option.description}
                          </FieldDescription>
                        </div>
                        <div className="self-start">
                          <RadioGroupItem id={id} value={option.value} />
                        </div>
                      </div>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              )
            }

            return null
          })}
        </RadioGroup>
      )}

      {/* CHECKBOX GROUP */}
      {fieldConfig.type === "checkbox-group" && (
        <CheckboxGroupField
          field={field}
          fieldConfig={fieldConfig}
          labelId={labelId}
          describedBy={describedBy}
          invalid={!!error}
        />
      )}

      {/* PERMISSION MATRIX */}
      {fieldConfig.type === "permission-matrix" && (
        <PermissionMatrixField
          field={field}
          fieldConfig={fieldConfig}
          labelId={labelId}
          error={error}
        />
      )}

      {/* PHONE NUMBER */}
      {fieldConfig.type === "phone-number-select" && (
        <PhoneInputInput
          {...a11yProps}
          // Both only work with a country, and the library errors on any
          // boolean (even false) without one, so they're left undefined.
          international={countryCode ? true : undefined}
          withCountryCallingCode={countryCode ? true : undefined}
          country={(countryCode || undefined) as Country | undefined}
          value={field.value ?? ""}
          onChange={(value) => field.onChange(value ?? "")}
          disabled={fieldConfig.disabled}
          placeholder={fieldConfig.placeholder}
          className={cn(
            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
          )}
        />
      )}

      {/* FILEUPLOAD */}
      {fieldConfig.type === "file-upload" && (
        <FileUpload
          fieldConfig={fieldConfig}
          field={field}
          inputProps={a11yProps}
          descriptionId={descriptionId}
          invalid={!!error}
        />
      )}

      {/* LINKS */}
      {fieldConfig.type === "links" && (
        <LinksInput fieldConfig={fieldConfig} field={field} />
      )}

      {/* DATE */}
      {fieldConfig.type === "date" && (
        <DatePicker
          {...a11yProps}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={fieldConfig.disabled}
          placeholder={fieldConfig.placeholder}
          lang={locale}
        />
      )}

      {/* ---- END OF TYPES ----  */}
      {fieldConfig.description && !descriptionInside && (
        <FieldDescription id={descriptionId} className="text-sm">
          {fieldConfig.description}
        </FieldDescription>
      )}

      {/* ERROR */}
      {error && <FieldError id={errorId} errors={[error]} />}
    </Field>
  )
}
