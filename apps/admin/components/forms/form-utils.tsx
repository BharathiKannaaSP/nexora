import {
  OptionGroup,
  RegionOptionGroup,
  SelectFieldOptions,
  SelectOption,
} from "./form-types"

export function isOptionGroup(option: unknown): option is OptionGroup {
  return (
    typeof option === "object" &&
    option !== null &&
    "label" in option &&
    "options" in option
  )
}

export function isRegionGroup(option: unknown): option is RegionOptionGroup {
  return (
    typeof option === "object" &&
    option !== null &&
    "region" in option &&
    "options" in option
  )
}
export function flattenSelectOptions(
  options?: SelectFieldOptions
): SelectOption[] {
  if (!options) return []

  return options.flatMap((option) => {
    if (isOptionGroup(option) || isRegionGroup(option)) {
      return option.options
    }

    return [option]
  })
}
