import { z } from "zod"
import {
  ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
  ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
  ORGANIZATION_LOGO_MAX_SIZE_BYTES,
  ORGANIZATION_LOGO_MIME_TYPES,
} from "../onboarding/create-organization"

export const UPLOAD_PURPOSES = [
  "user-avatar",
  "org-logo",
  "org-document",
  "product-image",
] as const

export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number]

type UploadRule = {
  mimeTypes: readonly string[]
  maxBytes: number
  /** "image": shown inline and cached by the browser; "document": downloaded, never cached. */
  kind: "image" | "document"
}

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const

/**
 * Checked by the admin app for instant feedback and by media-service, whose
 * check is the one that counts. Every file is private.
 */
export const UPLOAD_RULES: Record<UploadPurpose, UploadRule> = {
  "user-avatar": {
    mimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 2 * 1024 * 1024,
    kind: "image",
  },
  "org-logo": {
    mimeTypes: ORGANIZATION_LOGO_MIME_TYPES,
    maxBytes: ORGANIZATION_LOGO_MAX_SIZE_BYTES,
    kind: "image",
  },
  "org-document": {
    mimeTypes: ORGANIZATION_DOCUMENTS_ALLOWED_MIME_TYPES,
    maxBytes: ORGANIZATION_DOCUMENTS_MAX_FILE_SIZE,
    kind: "document",
  },
  "product-image": {
    mimeTypes: IMAGE_MIME_TYPES,
    maxBytes: 5 * 1024 * 1024,
    kind: "image",
  },
}

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/msword": "doc",
}

export const FILE_NAME_MAX_LENGTH = 255

// private/uploads/{userId}/{purpose}/{uuid}.{ext}, as /uploads/complete builds it.
const UPLOAD_KEY_PATTERN =
  /^private\/uploads\/([A-Za-z0-9_-]+)\/([a-z-]+)\/[0-9a-f-]{36}\.[a-z]+$/

/**
 * Who uploaded a checked file, and what for, read from its key. media-service
 * picks the key after checking the file, so the owning service can trust it
 * without calling media-service: a key with another user's ID, or another
 * purpose, isn't theirs to attach.
 */
export const parseUploadKey = (
  key: string
): { userId: string; purpose: UploadPurpose } | null => {
  const [, userId, purpose] = UPLOAD_KEY_PATTERN.exec(key) ?? []

  if (
    !userId ||
    !purpose ||
    !(UPLOAD_PURPOSES as readonly string[]).includes(purpose)
  ) {
    return null
  }
  return { userId, purpose: purpose as UploadPurpose }
}

const objectKeySchema = z.string().min(1).max(1024)
const fileNameSchema = z.string().trim().min(1).max(FILE_NAME_MAX_LENGTH)

// Public routes (through the gateway).

export const createUploadSchema = z.object({
  purpose: z.enum(UPLOAD_PURPOSES),
  fileName: fileNameSchema,
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

export type CreateUploadInput = z.infer<typeof createUploadSchema>

export const objectKeyInputSchema = z.object({ key: objectKeySchema })

/** GET /media/uploads/url */
export const ownUploadUrlInputSchema = objectKeyInputSchema.extend({
  /** Download with this name; omit to open it inline (preview / view). */
  fileName: fileNameSchema.optional(),
})

export type OwnUploadUrlInput = z.infer<typeof ownUploadUrlInputSchema>

// Internal routes (service to service).

export const signFileUrlSchema = z.object({
  key: objectKeySchema,
  /** Download with this name; omit to use the file's default (inline for images). */
  fileName: fileNameSchema.optional(),
})

export type SignFileUrlInput = z.infer<typeof signFileUrlSchema>

export const signFileUrlsSchema = z.object({
  keys: z.array(objectKeySchema).min(1).max(100),
})
