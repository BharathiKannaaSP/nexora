import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@nexora/ui/components/combobox"
import { flattenSelectOptions } from "./form-utils"
import { ComponentProps, memo, useMemo } from "react"
import { ControllerRenderProps } from "react-hook-form"
import { FieldConfig } from "./form-types"
import { useTranslations } from "next-intl"

export const MultiSelectField = memo(function MultiSelectField({
  field,
  fieldConfig,
  inputProps,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
  fieldConfig: FieldConfig
  /** id / aria-* props so the field label is announced on the input. */
  inputProps?: ComponentProps<typeof ComboboxChipsInput>
}) {
  const t = useTranslations("common.form")
  const anchor = useComboboxAnchor()
  const options = useMemo(
    () => flattenSelectOptions(fieldConfig.options),
    [fieldConfig.options]
  )

  const labelMap = useMemo(
    () => new Map(options.map((o) => [o.value, o.label])),
    [options]
  )

  const items = options.map((o) => o.value)

  return (
    <Combobox
      multiple
      items={items}
      value={field.value ?? []}
      onValueChange={field.onChange}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value) => (
                <ComboboxChip key={value}>{labelMap.get(value)}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                {...inputProps}
                placeholder={fieldConfig.placeholder}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{t("noResults")}</ComboboxEmpty>

        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {labelMap.get(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
})
