import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

export const approvalsMetadata = async (
  params: Promise<LocaleParams>
): Promise<Metadata> => {
  const { lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "approvals" })

  return { title: t("metadata.title"), description: t("metadata.description") }
}
