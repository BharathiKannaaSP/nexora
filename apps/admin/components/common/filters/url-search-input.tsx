"use client"

import type { ComponentProps } from "react"

import { useSearchParamState } from "@/hooks/use-search-param-state"

import { SearchInput } from "./search-input"

type UrlSearchInputProps = {
  /** The query param it reads and writes, e.g. "q". */
  param: string
} & Omit<ComponentProps<typeof SearchInput>, "value" | "onValueChange">

export const UrlSearchInput = ({ param, ...props }: UrlSearchInputProps) => {
  const { searchParams, set } = useSearchParamState()

  return (
    <SearchInput
      {...props}
      value={searchParams.get(param) ?? ""}
      onValueChange={(value) => set({ [param]: value }, { history: "replace" })}
    />
  )
}
