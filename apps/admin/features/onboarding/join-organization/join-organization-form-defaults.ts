import type { DefaultValues } from "react-hook-form"

import {
  PERMISSION_ACTIONS,
  type PermissionAction,
} from "@nexora/schemas/onboarding/become-admin"
import type { SavedFile } from "@nexora/schemas/onboarding/create-organization"
import {
  JOIN_DOCUMENT_SLOTS,
  JOIN_ORGANIZATION_DEPARTMENTS,
  joinDocumentRulesFor,
  ORGANIZATION_PERMISSION_MODULES,
  type JoinDocumentSlot,
  type JoinOrganizationFormValues,
} from "@nexora/schemas/onboarding/join-organization"
import type {
  JoinOrganizationFormDetails,
  OrganizationRequestPermission,
} from "@nexora/shared/types/onboarding"

type OrganizationModule = (typeof ORGANIZATION_PERMISSION_MODULES)[number]

/** { PRODUCT_MANAGEMENT: ["VIEW", "EDIT"] }, as the permission matrix holds it. */
export type ModulePermissions = Partial<
  Record<OrganizationModule, PermissionAction[]>
>

const SLOT_BY_DOCUMENT_TYPE = Object.fromEntries(
  Object.entries(JOIN_DOCUMENT_SLOTS).map(([slot, type]) => [type, slot])
) as Record<string, JoinDocumentSlot>

/**
 * Permission rows grouped by module, modules and actions in catalog order.
 * Rows outside the organization modules or actions are dropped.
 */
export const toModulePermissions = (
  rows: Pick<OrganizationRequestPermission, "moduleCode" | "accessLevel">[]
): ModulePermissions => {
  const permissions: ModulePermissions = {}

  for (const module of ORGANIZATION_PERMISSION_MODULES) {
    const actions = PERMISSION_ACTIONS.filter((action) =>
      rows.some(
        ({ moduleCode, accessLevel }) =>
          moduleCode === module && accessLevel === action
      )
    )
    if (actions.length > 0) permissions[module] = actions
  }

  return permissions
}

/**
 * The saved documents by form slot. Only slots `documentCountryCode` asks
 * for are kept, so a file of a slot that no longer applies isn't sent again.
 */
export const toJoinDocuments = (
  saved: Pick<JoinOrganizationFormDetails, "proposedDocuments"> | null,
  documentCountryCode: string
): Partial<Record<JoinDocumentSlot, SavedFile>> => {
  const slots = new Set(
    joinDocumentRulesFor(documentCountryCode).map(({ slot }) => slot)
  )
  const documents: Partial<Record<JoinDocumentSlot, SavedFile>> = {}

  for (const document of saved?.proposedDocuments ?? []) {
    const slot = SLOT_BY_DOCUMENT_TYPE[document.documentType]
    if (!slot || !slots.has(slot)) continue

    documents[slot] = {
      key: document.objectKey,
      originalFileName: document.originalFileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
    }
  }

  return documents
}

const isDepartment = (
  value: string | null | undefined
): value is JoinOrganizationFormValues["department"] =>
  (
    JOIN_ORGANIZATION_DEPARTMENTS as readonly (string | null | undefined)[]
  ).includes(value)

/**
 * The form's starting values: the saved request when the user comes back to
 * step 3, else empty. Saved files go back into their fields as SavedFiles, so
 * they're kept unless the user picks new ones.
 */
export const toJoinOrganizationFormDefaults = (
  saved: JoinOrganizationFormDetails | null,
  documentCountryCode: string
): DefaultValues<JoinOrganizationFormValues> => ({
  organizationId: saved?.organizationId ?? "",
  employeeId: saved?.employeeId ?? "",
  jobTitle: saved?.jobTitle ?? "",
  department: isDepartment(saved?.department) ? saved.department : undefined,
  workEmail: saved?.workEmail ?? "",
  // A calendar date; a timestamp is cut to its "YYYY-MM-DD".
  joiningDate: saved?.joiningDate?.slice(0, 10) ?? "",
  reportingManager: saved?.reportingManager ?? "",
  message: saved?.message ?? "",
  additionalNotes: saved?.additionalNotes ?? "",
  documentCountryCode,
  permissions: toModulePermissions(saved?.requestedPermissions ?? []),
  proposedDocuments: toJoinDocuments(saved, documentCountryCode),
})
