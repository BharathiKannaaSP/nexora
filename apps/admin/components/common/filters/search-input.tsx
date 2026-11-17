"use client"

import { SearchIcon } from "lucide-react"
import { useEffect, useEffectEvent, useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@nexora/ui/components/input-group"
import { cn } from "@nexora/ui/lib/utils"

import { useDebouncedValue } from "@/hooks/use-debounced-value"

interface SearchInputProps {
  value: string
  onValueChange: (value: string) => void
  label: string
  placeholder?: string
  maxLength?: number
  debounceMs?: number
  className?: string
}

/** Calls onValueChange once typing pauses. Follows `value` when it changes outside, e.g. "Clear filters". */
export const SearchInput = ({
  value,
  onValueChange,
  label,
  placeholder,
  maxLength,
  debounceMs = 300,
  className,
}: SearchInputProps) => {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  // What we last sent up. When `value` comes back as that, it's our own echo,
  // so the draft (which may have moved on, or carry a trailing space) stays.
  const [committed, setCommitted] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== committed) {
      setCommitted(value)
      setDraft(value)
    }
  }

  const debounced = useDebouncedValue(draft, debounceMs)
  const commit = useEffectEvent((next: string) => {
    const trimmed = next.trim()
    if (trimmed === value) return
    setCommitted(trimmed)
    onValueChange(trimmed)
  })
  useEffect(() => commit(debounced), [debounced])

  return (
    <InputGroup className={cn("sm:w-72", className)}>
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </InputGroup>
  )
}
