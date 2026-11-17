export type PageItem = number | "ellipsis-start" | "ellipsis-end"

export const pageCount = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / pageSize))

/** 1-based, inclusive; { from: 0, to: 0 } when there's nothing. */
export const pageRange = (page: number, pageSize: number, total: number) =>
  total === 0
    ? { from: 0, to: 0 }
    : {
        from: (page - 1) * pageSize + 1,
        to: Math.min(page * pageSize, total),
      }

/**
 * The buttons to show, e.g. page 2 of 7 → [1, 2, 3, 4, 5, "ellipsis-end", 7].
 * Always the first and last page, `siblings` either side of the current one,
 * and an ellipsis for each gap.
 */
export const getPageItems = (
  page: number,
  count: number,
  siblings = 1
): PageItem[] => {
  // first + last + current + siblings + two ellipses
  const slots = siblings * 2 + 5
  if (count <= slots) return Array.from({ length: count }, (_, i) => i + 1)

  const start = Math.max(2, Math.min(page - siblings, count - slots + 3))
  const end = Math.min(count - 1, Math.max(page + siblings, slots - 2))

  return [
    1,
    ...(start > 2 ? (["ellipsis-start"] as const) : []),
    ...Array.from({ length: end - start + 1 }, (_, i) => start + i),
    ...(end < count - 1 ? (["ellipsis-end"] as const) : []),
    count,
  ]
}
