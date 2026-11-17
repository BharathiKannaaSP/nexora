"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nexora/ui/components/select"
import { cn } from "@nexora/ui/lib/utils"

export interface FilterOption<T extends string> {
  value: T
  label: string
}

interface FilterSelectProps<T extends string> {
  /** Shown before the value, "Status: Pending", and as the accessible name. */
  label: string
  value: T
  options: readonly FilterOption<T>[]
  onValueChange: (value: T) => void
  className?: string
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: FilterSelectProps<T>) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        const match = options.find((option) => option.value === next)
        if (match) onValueChange(match.value)
      }}
    >
      <SelectTrigger
        aria-label={label}
        title={`${label}: ${options.find((option) => option.value === value)?.label ?? ""}`}
        className={cn("h-9 w-full max-w-full sm:w-auto sm:min-w-40", className)}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
