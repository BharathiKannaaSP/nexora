"use client"

import { useFormatter } from "next-intl"

/** Date over time, in the viewer's locale and time zone. */
export const DateTimeCell = ({ value }: { value: string }) => {
  const format = useFormatter()
  const date = new Date(value)

  return (
    <time dateTime={value} className="flex flex-col text-sm whitespace-nowrap">
      <span>{format.dateTime(date, { dateStyle: "medium" })}</span>
      <span className="text-xs text-muted-foreground">
        {format.dateTime(date, { timeStyle: "short" })}
      </span>
    </time>
  )
}
