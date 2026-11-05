"use client"

import { FileText, ImageUp, Paperclip, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { ControllerRenderProps } from "react-hook-form"
import { Button } from "@nexora/ui/components/button"
import { Spinner } from "@nexora/ui/components/spinner"
import { cn } from "@nexora/ui/lib/utils"
import { DeleteFileDialog } from "./delete-file-dialog"
import type { FieldConfig } from "./form-types"

interface FileUploadProps {
  fieldConfig: FieldConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>
  /** id and aria-* attributes, put on the native file input. */
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  /** The box variants show the description inside, under this id. */
  descriptionId: string
  invalid?: boolean
}

const formatSize = (bytes: number, locale?: string) => {
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

/** An object URL for an image file, revoked when it changes or unmounts. */
const useImagePreview = (file: File | undefined) => {
  const url = useMemo(
    () =>
      file?.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    [file]
  )
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url]
  )
  return url
}

/** A file uploaded earlier and put back in the form, e.g. a SavedFile. */
interface SavedFileValue {
  originalFileName: string
  sizeBytes?: number
}

const isSavedFileValue = (value: unknown): value is SavedFileValue =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as SavedFileValue).originalFileName === "string"

/**
 * A file picker for EntityForm. With `maxFiles` 1 (the default) the value is
 * a File, a file saved earlier (shown by name, see SavedFileValue) or
 * undefined; otherwise a File[]. Type and size are left to the form's schema,
 * so its translated errors show under the field.
 */
const FileUpload = ({
  fieldConfig,
  field,
  inputProps,
  descriptionId,
  invalid,
}: FileUploadProps) => {
  const t = useTranslations("common.fileUpload")
  const locale = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const hintId = useId()

  const variant = fieldConfig.uploadVariant ?? "dropzone"
  const maxFiles = fieldConfig.maxFiles ?? 1
  const multiple = maxFiles > 1
  const disabled = fieldConfig.disabled

  const files: File[] = multiple
    ? Array.isArray(field.value)
      ? field.value
      : []
    : field.value instanceof File
      ? [field.value]
      : []
  const firstFile = files[0]
  const preview = useImagePreview(multiple ? undefined : firstFile)

  // What the single-file field shows: the picked File, or the saved file.
  const savedFile =
    !multiple && isSavedFileValue(field.value) ? field.value : undefined
  const shown = firstFile
    ? { name: firstFile.name, size: firstFile.size }
    : savedFile
      ? { name: savedFile.originalFileName, size: savedFile.sizeBytes }
      : undefined
  const isFull = files.length >= maxFiles

  const isImageUpload =
    !!fieldConfig.accept?.length &&
    fieldConfig.accept.every((type) => type.startsWith("image/"))

  const Icon = fieldConfig.uploadIcon ?? (isImageUpload ? ImageUp : FileText)

  const setFiles = (picked: File[]) => {
    if (!picked.length) return
    if (multiple) {
      field.onChange([...files, ...picked].slice(0, maxFiles))
    } else {
      field.onChange(picked[0])
    }
    field.onBlur()
  }

  const removeFile = (index: number) => {
    // null, not undefined: react-hook-form shows a field's default value for
    // undefined, so a saved file would come straight back.
    field.onChange(multiple ? files.filter((_, i) => i !== index) : null)
    field.onBlur()
    // The same file can be picked again after removing it.
    if (inputRef.current) inputRef.current.value = ""
  }

  // A saved file can be deleted for good (see onDeleteSavedFile): ask first,
  // and clear the field only once it's gone.
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const deletesSavedFile = !!savedFile && !!fieldConfig.onDeleteSavedFile

  const requestRemove = () => {
    if (deletesSavedFile) setConfirmDelete(true)
    else removeFile(0)
  }

  const deleteSavedFile = async () => {
    setDeleting(true)
    const deleted = await fieldConfig.onDeleteSavedFile!(field.value)
    setDeleting(false)
    if (deleted) removeFile(0)
  }

  const openPicker = () => {
    if (!disabled) inputRef.current?.click()
  }

  const dropHandlers = {
    onDragEnter: (event: React.DragEvent) => {
      event.preventDefault()
      if (disabled) return
      dragDepth.current++
      setIsDragging(true)
    },
    onDragOver: (event: React.DragEvent) => event.preventDefault(),
    // Children fire their own enter/leave events; only the outermost leave counts.
    onDragLeave: () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) setIsDragging(false)
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault()
      dragDepth.current = 0
      setIsDragging(false)
      if (!disabled) setFiles(Array.from(event.dataTransfer.files))
    },
  }

  // Rendered by every variant, so the dialog goes with it.
  const nativeInput = (
    <>
      {deletesSavedFile && shown && (
        <DeleteFileDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          name={shown.name}
          onConfirm={deleteSavedFile}
        />
      )}
      <input
        {...inputProps}
        ref={inputRef}
        type="file"
        name={field.name}
        className="sr-only"
        tabIndex={-1}
        multiple={multiple}
        accept={fieldConfig.accept?.join(",")}
        disabled={disabled}
        onChange={(event) => {
          setFiles(Array.from(event.target.files ?? []))
          event.target.value = ""
        }}
      />
    </>
  )

  const fileList = multiple && files.length > 0 && (
    <ul className="space-y-2">
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.lastModified}-${index}`}
          className="flex items-center gap-2 rounded-sm border border-input px-2.5 py-1.5 text-sm"
        >
          <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatSize(file.size, locale)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={() => removeFile(index)}
            aria-label={t("remove", { name: file.name })}
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  )

  if (variant === "inline") {
    return (
      <div className={cn("space-y-2", fieldConfig.uploadClassName)}>
        <div
          {...dropHandlers}
          className={cn(
            "flex h-8 w-full min-w-0 items-center gap-2 rounded-sm border border-input bg-transparent pr-1 pl-2.5 text-sm transition-colors dark:bg-input/30",
            "has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            isDragging && "border-primary bg-primary/5",
            invalid &&
              "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {nativeInput}
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !shown && "text-muted-foreground"
            )}
          >
            {multiple || !shown
              ? (fieldConfig.placeholder ?? t("noFile"))
              : shown.name}
          </span>
          {!multiple && shown && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={disabled || deleting}
              onClick={requestRemove}
              aria-label={t("remove", { name: shown.name })}
            >
              {deleting ? <Spinner aria-hidden="true" /> : <X />}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="xs"
            disabled={disabled || (multiple && isFull)}
            onClick={openPicker}
            aria-describedby={inputProps["aria-describedby"]}
          >
            {shown && !multiple ? t("replace") : t("browse")}
          </Button>
        </div>
        {fileList}
      </div>
    )
  }

  const isCompact = variant === "compact"
  const title = isCompact
    ? fieldConfig.label
    : (fieldConfig.placeholder ?? t("upload"))

  return (
    <div className="space-y-2">
      <div
        {...dropHandlers}
        className={cn(
          "relative flex w-full flex-col items-center justify-center rounded-lg border border-input bg-muted/30 text-center transition-colors dark:bg-input/30",
          isCompact ? "min-h-28 gap-1 p-3" : "min-h-32 gap-1.5 p-4",
          !disabled &&
            !(isFull && multiple) &&
            "hover:border-primary/60 hover:bg-primary/5",
          "has-[button[data-dropzone]:focus-visible]:border-ring has-[button[data-dropzone]:focus-visible]:ring-3 has-[button[data-dropzone]:focus-visible]:ring-ring/50",
          isDragging && "border-dashed border-primary bg-primary/5",
          invalid &&
            "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
          disabled && "cursor-not-allowed opacity-50",
          fieldConfig.uploadClassName
        )}
      >
        {nativeInput}
        {/* Covers the whole box, so a click anywhere opens the picker. */}
        <button
          type="button"
          data-dropzone
          className="absolute inset-0 rounded-lg outline-none disabled:cursor-not-allowed"
          disabled={disabled || (multiple && isFull)}
          onClick={openPicker}
          aria-label={
            !multiple && shown
              ? `${t("replace")}: ${fieldConfig.label}`
              : `${title}: ${fieldConfig.label}`
          }
          aria-describedby={
            [inputProps["aria-describedby"], hintId]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />

        {!multiple && shown ? (
          <>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
              <img
                src={preview}
                alt=""
                className={cn(
                  "rounded-sm object-contain",
                  isCompact ? "max-h-12" : "max-h-16"
                )}
              />
            ) : (
              <Icon
                className={cn("text-primary", isCompact ? "size-6" : "size-8")}
              />
            )}
            <p className="w-full truncate px-6 text-sm font-medium">
              {shown.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {shown.size ? `${formatSize(shown.size, locale)} · ` : ""}
              {t("clickToReplace")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1.5 right-1.5 z-10"
              disabled={disabled || deleting}
              onClick={requestRemove}
              aria-label={t("remove", { name: shown.name })}
            >
              {deleting ? <Spinner aria-hidden="true" /> : <X />}
            </Button>
          </>
        ) : (
          <>
            <Icon
              className={cn(
                "text-muted-foreground",
                isCompact ? "size-6" : "size-8"
              )}
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium">{title}</p>
            {isCompact && fieldConfig.placeholder && (
              <p className="text-xs text-muted-foreground">
                {fieldConfig.placeholder}
              </p>
            )}
            <p id={hintId} className="text-xs text-muted-foreground">
              {isDragging ? t("dropHere") : t("dragHint")}
            </p>
          </>
        )}

        {fieldConfig.description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {fieldConfig.description}
          </p>
        )}
      </div>
      {fileList}
    </div>
  )
}

export default FileUpload
