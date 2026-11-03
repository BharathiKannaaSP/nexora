import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@nexora/ui/components/combobox"
import { flattenSelectOptions } from "./form-utils"
import { ComponentProps, memo, useMemo } from "react"
import { ControllerRenderProps } from "react-hook-form"
import { FieldConfig } from "./form-types"
import { useTranslations } from "next-intl"

/** A single select the user can type into to filter, e.g. for countries. */
export const ComboboxField = memo(function ComboboxField({
  field,
  fieldConfig,
  inputProps,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
  fieldConfig: FieldConfig
  /** id / aria-* props so the field label is announced on the input. */
  inputProps?: ComponentProps<typeof ComboboxInput>
}) {
  const t = useTranslations("common.form")
  const options = useMemo(
    () => flattenSelectOptions(fieldConfig.options),
    [fieldConfig.options]
  )

  const labelMap = useMemo(
    () => new Map(options.map((o) => [o.value, o.label])),
    [options]
  )

  const items = useMemo(() => options.map((o) => o.value), [options])

  return (
    <Combobox
      items={items}
      value={field.value || null}
      onValueChange={(value) => field.onChange(value ?? "")}
      // The input shows, and the search matches, the label rather than the
      // stored value: "India", not "IN".
      itemToStringLabel={(value: string) => labelMap.get(value) ?? value}
      disabled={fieldConfig.disabled}
    >
      <ComboboxInput
        {...inputProps}
        className="w-full"
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        onBlur={field.onBlur}
      />

      <ComboboxContent>
        <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>

        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {labelMap.get(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
})
