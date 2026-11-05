"use client"

import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Trash2,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@nexora/ui/components/button"
import { Spinner } from "@nexora/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@nexora/ui/components/table"
import { useApiToast } from "@/hooks/use-api-toast"
import { useObjectUrl } from "@/hooks/use-object-url"
import { getUploadUrl } from "@/lib/api/media/get-upload-url"
import { DeleteFileDialog } from "./delete-file-dialog"
import { formatFileSize } from "./format-file-size"

/** A file uploaded earlier and put back in the form, e.g. a SavedFile. */
export interface StoredFile {
  key: string
  originalFileName: string
  contentType?: string
  sizeBytes?: number
}

export interface UploadedFileItem {
  id: string
  /** What the file is, e.g. "Business registration". */
  label: string
  /** Rows without a file are left out. */
  value: File | StoredFile | null | undefined
  /** Clears the file from its field; no Delete button when left out. */
  onRemove?: () => void
  /**
   * Deletes a saved file for good. With it, Delete asks first and clears the
   * field only when this resolves true; newly picked files are just cleared.
   */
  onDeleteSavedFile?: (value: StoredFile) => Promise<boolean>
}

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|avif|svg)$/i

const isImage = (value: File | StoredFile) =>
  value instanceof File
    ? value.type.startsWith("image/")
    : value.contentType
      ? value.contentType.startsWith("image/")
      : IMAGE_EXTENSION.test(value.originalFileName)

const isStoredFile = (value: unknown): value is StoredFile =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as StoredFile).key === "string" &&
  typeof (value as StoredFile).originalFileName === "string"

const UploadedFileRow = ({
  label,
  value,
  onRemove,
  onDeleteSavedFile,
}: {
  label: string
  value: File | StoredFile
  onRemove?: () => void
  onDeleteSavedFile?: (value: StoredFile) => Promise<boolean>
}) => {
  const t = useTranslations("common.uploadedFiles")
  const tActions = useTranslations("common.actions")
  const tFileUpload = useTranslations("common.fileUpload")
  const locale = useLocale()
  const showApiToast = useApiToast()
  const [busy, setBusy] = useState<"view" | "download" | "delete">()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const local = value instanceof File ? value : undefined
  const stored = local ? undefined : (value as StoredFile)

  // For View / Download of a newly picked file; saved files get a fresh
  // signed URL on each click, since those expire.
  const localUrl = useObjectUrl(local)

  const name = local?.name ?? stored!.originalFileName
  const size = local?.size ?? stored?.sizeBytes
  const Icon = isImage(value) ? ImageIcon : FileText

  const view = async () => {
    if (localUrl) {
      window.open(localUrl, "_blank", "noopener")
      return
    }
    // Opened before the await, so popup blockers still see a click.
    const tab = window.open("", "_blank")
    setBusy("view")
    const result = await getUploadUrl({ key: stored!.key })
    setBusy(undefined)
    if (!result.success) {
      tab?.close()
      showApiToast(result)
      return
    }
    if (tab) {
      tab.opener = null
      tab.location.href = result.data.url
    } else {
      window.open(result.data.url, "_blank", "noopener")
    }
  }

  const download = async () => {
    if (localUrl) {
      const link = document.createElement("a")
      link.href = localUrl
      link.download = name
      link.click()
      return
    }
    // Signed as an attachment named `name`, so the page stays put.
    setBusy("download")
    const result = await getUploadUrl({ key: stored!.key, fileName: name })
    setBusy(undefined)
    if (!result.success) {
      showApiToast(result)
      return
    }
    window.location.assign(result.data.url)
  }

  // A saved file is deleted for good by onDeleteSavedFile; the field is
  // cleared only once that worked.
  const deletesSavedFile = !!stored && !!onRemove && !!onDeleteSavedFile

  const deleteSavedFile = async () => {
    setBusy("delete")
    const deleted = await onDeleteSavedFile!(stored!)
    setBusy(undefined)
    if (deleted) onRemove?.()
  }

  return (
    <TableRow>
      <TableCell className="w-12">
        <span className="flex size-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </TableCell>
      <TableCell className="max-w-64">
        <p className="truncate font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground" title={name}>
          {name}
        </p>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {size ? formatFileSize(size, locale) : "—"}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={view}
            disabled={!!busy}
            aria-label={t("viewFile", { name })}
          >
            <Eye aria-hidden="true" />
            <span className="hidden sm:inline">{t("view")}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={download}
            disabled={!!busy}
            aria-label={t("downloadFile", { name })}
          >
            <Download aria-hidden="true" />
            <span className="hidden sm:inline">{t("download")}</span>
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              // A saved file is deleted for good, so ask first; a newly
              // picked one was never uploaded and is just cleared.
              onClick={deletesSavedFile ? () => setConfirmOpen(true) : onRemove}
              disabled={!!busy}
              aria-label={tFileUpload("remove", { name })}
            >
              {busy === "delete" ? (
                <Spinner aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{tActions("delete")}</span>
            </Button>
          )}
        </div>
        {deletesSavedFile && (
          <DeleteFileDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            name={name}
            onConfirm={deleteSavedFile}
          />
        )}
      </TableCell>
    </TableRow>
  )
}

/**
 * The files picked or saved in a form, with a type icon and View / Download
 * for each. Newly picked files use a local blob: URL; saved
 * ones get a short-lived signed URL from media-service.
 */
export const UploadedFilesTable = ({
  items,
}: {
  items: UploadedFileItem[]
}) => {
  const t = useTranslations("common.uploadedFiles")

  const rows = items.filter(
    (item): item is UploadedFileItem & { value: File | StoredFile } =>
      item.value instanceof File || isStoredFile(item.value)
  )

  if (!rows.length) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.file")}</TableHead>
          <TableHead>{t("columns.size")}</TableHead>
          <TableHead className="text-end">{t("columns.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((item) => (
          <UploadedFileRow
            key={item.id}
            label={item.label}
            value={item.value}
            onRemove={item.onRemove}
            onDeleteSavedFile={item.onDeleteSavedFile}
          />
        ))}
      </TableBody>
    </Table>
  )
}
