"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Calendar } from "./calendar"

interface DatePickerProps {
  /** "YYYY-MM-DD", or "" when empty */
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  id?: string
  placeholder?: string
  disabled?: boolean
  /** Latest selectable date, e.g. today for a date of birth */
  maxDate?: Date
  /** BCP 47 tag the date and calendar are shown in, e.g. "ta"; the page's language. */
  lang?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

const toDate = (value?: string) => {
  if (!value) return undefined
  const date = parse(value, "yyyy-MM-dd", new Date())
  return isValid(date) ? date : undefined
}

/**
 * The calendar's visible text in `lang`, from Intl rather than date-fns
 * locales, which have none for some app languages (e.g. Malayalam).
 */
const createIntlFormatters = (lang: string) => {
  const caption = new Intl.DateTimeFormat(lang, {
    month: "long",
    year: "numeric",
  })
  const month = new Intl.DateTimeFormat(lang, { month: "short" })
  const year = new Intl.DateTimeFormat(lang, { year: "numeric" })
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "short" })

  return {
    formatCaption: (date: Date) => caption.format(date),
    formatMonthDropdown: (date: Date) => month.format(date),
    formatYearDropdown: (date: Date) => year.format(date),
    formatWeekdayName: (date: Date) => weekday.format(date),
  }
}

export function DatePicker({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  maxDate,
  lang,
  ...a11yProps
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = toDate(value)

  const formatters = React.useMemo(
    () => (lang ? createIntlFormatters(lang) : undefined),
    [lang]
  )
  const triggerFormat = React.useMemo(
    () =>
      lang ? new Intl.DateTimeFormat(lang, { dateStyle: "long" }) : undefined,
    [lang]
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur?.()
      }}
    >
      <PopoverTrigger
        render={
          <Button
            {...a11yProps}
            variant="outline"
            disabled={disabled}
            className="w-full justify-start font-normal"
          >
            <CalendarIcon />
            {selected
              ? (triggerFormat?.format(selected) ?? format(selected, "PPP"))
              : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate}
          captionLayout="dropdown"
          formatters={formatters}
          startMonth={new Date(1900, 0)}
          endMonth={maxDate}
          disabled={maxDate ? { after: maxDate } : undefined}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
