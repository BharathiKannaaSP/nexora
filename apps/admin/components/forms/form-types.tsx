import { LucideIcon } from "lucide-react"

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "combobox"
  | "switch"
  | "multiselect"
  | "email"
  | "date"
  | "password"
  | "radio-group"
  | "phone-number-select"
  | "checkbox-group"
  | "file-upload"
  | "links"
  | "permission-matrix"

export interface SelectOption {
  label: string
  value: string
  description?: string
  icon?: LucideIcon
  // Checkbox Group: shown but can't be changed, e.g. a locked-in country.
  disabled?: boolean
}

export interface OptionGroup {
  label: string
  options: SelectOption[]
}

export interface RegionOptionGroup {
  region: string
  options: SelectOption[]
}

export type SelectFieldOptions =
  SelectOption[] | OptionGroup[] | RegionOptionGroup[]

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any
  colSpan?: 1 | 2
  options?: SelectFieldOptions
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
  // Text, email and password inputs
  icon?: LucideIcon
  endAdornment?: React.ReactNode
  // File Upload
  maxFiles?: number
  maxFileSize?: number
  accept?: string[]
  endpoint?: string
  /**
   * "dropzone": a large box (default). "compact": a small card with the
   * label inside, for rows of documents. "inline": one line, like an input.
   */
  uploadVariant?: "dropzone" | "compact" | "inline"
  /** Width or height overrides for the box, e.g. "h-48" or "max-w-xs". */
  uploadClassName?: string
  uploadIcon?: LucideIcon
  /**
   * Deletes a saved file (one that isn't a File, e.g. a SavedFile) for good
   * when the user removes it. Its X then asks first, and the field is only
   * cleared when this resolves true. Newly picked files are just cleared.
   */
  onDeleteSavedFile?: (value: unknown) => Promise<boolean>
  // Links, Checkbox Group
  maxItems?: number
  // Checkbox Group
  direction?: "row" | "column"
  // Permission Matrix
  permissionMatrix?: PermissionMatrixConfig
}

/**
 * One table per group (e.g. a country), with a row per module and a column
 * per action. The value is { [group]: { [module]: action[] } }.
 */
export interface PermissionMatrixConfig {
  groups: SelectOption[]
  modules: SelectOption[]
  actions: SelectOption[]
  moduleColumnLabel: string
  /** e.g. "7 modules selected", from the number of modules with an action. */
  selectedCountLabel: (count: number) => string
}

export interface FormSection {
  title: string
  description?: string
  fields: string[]
  isLastField?: boolean
  icon?: React.ComponentType
  /** Fields per row on wide screens: 2 (default), or 4 for rows of cards. */
  columns?: 2 | 4
}

export interface EntityFormConfig {
  /** Leave out to skip the header, e.g. when a single section carries it. */
  title?: string
  description?: string
  submitLabel?: string
  updateLabel?: string
  sections: FormSection[]
  fields: FieldConfig[]
}
