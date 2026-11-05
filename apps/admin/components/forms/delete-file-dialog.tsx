"use client"

import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@nexora/ui/components/alert-dialog"
import { Button } from "@nexora/ui/components/button"

interface DeleteFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The file's name, shown in the title. */
  name: string
  onConfirm: () => void
}

/** Asks before a saved file is deleted for good. */
export const DeleteFileDialog = ({
  open,
  onOpenChange,
  name,
  onConfirm,
}: DeleteFileDialogProps) => {
  const t = useTranslations("common.uploadedFiles")
  const tActions = useTranslations("common.actions")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle", { name })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose>{tActions("cancel")}</AlertDialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            {tActions("delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
