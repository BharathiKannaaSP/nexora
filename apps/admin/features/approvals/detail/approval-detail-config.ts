import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionModuleCode,
} from "@nexora/schemas/onboarding/become-admin"
import type { ApprovalRequestRecord } from "@nexora/shared/types/approvals"

import type { SubmittedPart } from "@/features/onboarding/review/submitted-information"
import { firstParam, type SearchParamsRecord } from "@/lib/url/search-params"

/** The tabs of a request's page, each showing some parts of the submission. */
export const APPROVAL_DETAIL_TABS = {
  details: ["personal", "request"],
  access: ["permissions"],
  documents: ["documents"],
} as const satisfies Record<string, readonly SubmittedPart[]>

export type ApprovalDetailTab = keyof typeof APPROVAL_DETAIL_TABS

export const DEFAULT_APPROVAL_DETAIL_TAB: ApprovalDetailTab = "details"

/** URL param of the open tab. */
export const APPROVAL_TAB_PARAM = "tab"

export const parseApprovalDetailTab = (
  params: SearchParamsRecord
): ApprovalDetailTab => {
  const tab = firstParam(params, APPROVAL_TAB_PARAM)
  return tab && tab in APPROVAL_DETAIL_TABS
    ? (tab as ApprovalDetailTab)
    : DEFAULT_APPROVAL_DETAIL_TAB
}

/** The logo and documents a request carries. */
export const approvalDocumentCount = (request: ApprovalRequestRecord) =>
  request.type === "ADMIN_ACCESS"
    ? 0
    : request.organizationRequest.proposedDocuments.length +
      (request.organizationRequest.proposedLogoObjectKey ? 1 : 0)

const isModule = (code: string): code is PermissionModuleCode =>
  (PERMISSION_MODULES as readonly string[]).includes(code)

const isAction = (action: string): action is PermissionAction =>
  (PERMISSION_ACTIONS as readonly string[]).includes(action)

/**
 * Each module the request asks for, with its actions in catalog order, over
 * all its countries (an admin request asks per country).
 */
export const requestedModules = (request: ApprovalRequestRecord) => {
  const rows =
    request.type === "ADMIN_ACCESS"
      ? request.adminAccessRequest.requestedPermissions
      : request.organizationRequest.requestedPermissions

  const byModule = new Map<PermissionModuleCode, Set<PermissionAction>>()
  for (const { moduleCode, accessLevel } of rows) {
    if (!isModule(moduleCode) || !isAction(accessLevel)) continue
    const actions = byModule.get(moduleCode) ?? new Set()
    actions.add(accessLevel)
    byModule.set(moduleCode, actions)
  }

  return PERMISSION_MODULES.flatMap((code) => {
    const actions = byModule.get(code)
    return actions
      ? [{ code, actions: PERMISSION_ACTIONS.filter((a) => actions.has(a)) }]
      : []
  })
}
