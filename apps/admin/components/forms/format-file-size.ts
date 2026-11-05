/** e.g. "312 kB" or "1.4 MB", in the page's locale. */
export const formatFileSize = (bytes: number, locale?: string) => {
  const units = ["byte", "kilobyte", "megabyte"] as const
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: units[unit],
    unitDisplay: "short",
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value)
}
