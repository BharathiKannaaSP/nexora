import { getTranslations } from "next-intl/server"

import { DashboardShell } from "@/components/common/layout/dashboard-shell"
import {
  resolveLocaleParams,
  type LocaleParams,
} from "@/lib/i18n/locale-params"

interface DashboardPageProps {
  params: Promise<LocaleParams>
}

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { country, lang } = await resolveLocaleParams(params)
  const t = await getTranslations({ locale: lang, namespace: "dashboard" })

  return (
    <DashboardShell country={country} lang={lang}>
      <h1>{t("home.metadata.title")}</h1>
    </DashboardShell>
  )
}

export default DashboardPage
