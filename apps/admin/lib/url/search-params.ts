export type SearchParamsRecord = Record<string, string | string[] | undefined>

export type SearchParamPatch = Record<
  string,
  string | number | null | undefined
>

/** The first value of a param from Next's `searchParams`. */
export const firstParam = (params: SearchParamsRecord, key: string) => {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/**
 * `path` with `params` applied: null, undefined and "" remove a key, and a
 * value equal to its `defaults` entry is left out, so default views have
 * clean URLs.
 */
export const withSearchParams = (
  path: string,
  params: SearchParamPatch,
  defaults: SearchParamPatch = {}
) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue
    if (defaults[key] !== undefined && String(defaults[key]) === String(value)) {
      continue
    }
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}
