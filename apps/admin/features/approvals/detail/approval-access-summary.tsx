"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

import type { ApprovalDetail } from "@nexora/shared/types/approvals"

import { PageSection } from "@/components/common/page/page-section"
import { IconTile } from "@/components/common/stats/icon-tile"
import type { Tone } from "@/components/common/tones"
import {
  ACTION_KEYS,
  MODULE_ICONS,
  MODULE_KEYS,
} from "@/features/onboarding/become-admin/become-admin-form-config"

import { requestedModules } from "./approval-detail-config"

/** Tiles past this fold into "+N more", which opens the access tab. */
const MAX_TILES = 5

const TILE_TONES: Tone[] = ["brand", "info", "success", "warning", "danger"]

interface ApprovalAccessSummaryProps {
  approval: ApprovalDetail
  /** The "Requested access" tab. */
  accessHref: string
}

export const ApprovalAccessSummary = ({
  approval,
  accessHref,
}: ApprovalAccessSummaryProps) => {
  const t = useTranslations("approvals")
  const tOnboarding = useTranslations("onboarding")
  const modules = requestedModules(approval.request)

  if (modules.length === 0) return null

  const shown =
    modules.length > MAX_TILES ? modules.slice(0, MAX_TILES - 1) : modules
  const hidden = modules.length - shown.length

  return (
    <PageSection aria-label={t("detail.accessSummary.title")}>
      <div className="space-y-1">
        <h2 className="font-semibold">{t("detail.accessSummary.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(`detail.accessSummary.description.${approval.type}`)}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {shown.map(({ code, actions }, index) => (
          <li
            key={code}
            className="flex items-start gap-3 rounded-lg border p-3"
          >
            <IconTile
              icon={MODULE_ICONS[code]}
              tone={TILE_TONES[index % TILE_TONES.length]}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {tOnboarding(
                  `becomeAdminForm.modules.${MODULE_KEYS[code]}.label`
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {actions
                  .map((action) =>
                    tOnboarding(
                      `becomeAdminForm.actions.${ACTION_KEYS[action]}`
                    )
                  )
                  .join(", ")}
              </p>
            </div>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <Link
              href={accessHref}
              scroll={false}
              className="flex h-full items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <IconTile icon={Plus} tone="brand" size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {t("detail.accessSummary.more", { count: hidden })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("detail.accessSummary.moreDescription")}
                </p>
              </div>
            </Link>
          </li>
        )}
      </ul>
    </PageSection>
  )
}
