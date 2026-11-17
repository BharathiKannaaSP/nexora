"use client"

import { useSearchParamState } from "@/hooks/use-search-param-state"

import { FilterSelect, type FilterOption } from "./filter-select"

interface UrlFilterSelectProps<T extends string> {
  param: string
  label: string
  options: readonly FilterOption<T>[]
  /** Used when the param is missing or unknown, and left out of the URL. */
  defaultValue: T
  className?: string
}

export function UrlFilterSelect<T extends string>({
  param,
  defaultValue,
  options,
  ...props
}: UrlFilterSelectProps<T>) {
  const { searchParams, set } = useSearchParamState()
  const current = searchParams.get(param)
  const value = options.find((o) => o.value === current)?.value ?? defaultValue

  return (
    <FilterSelect
      {...props}
      options={options}
      value={value}
      onValueChange={(next) =>
        set({ [param]: next === defaultValue ? null : next })
      }
    />
  )
}
