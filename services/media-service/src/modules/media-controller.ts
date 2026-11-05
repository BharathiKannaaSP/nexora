import type { Request, RequestHandler } from "express"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { AppError } from "@nexora/shared/express/app-error"
import {
  createUploadSchema,
  objectKeyInputSchema,
  ownUploadUrlInputSchema,
  signFileUrlSchema,
  signFileUrlsSchema,
} from "@nexora/schemas/media/upload"
import {
  completeUploadService,
  createUploadService,
  deleteFileService,
  deleteOwnUploadService,
  getOwnUploadUrlService,
  signFileUrlService,
  signFileUrlsService,
} from "./media-service"

/** The user the gateway authenticated. */
const requireUserId = (req: Request) => {
  const userId = req.headers["x-user-id"]

  if (typeof userId !== "string" || !userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
  }
  return userId
}

// Public routes

export const createUpload: RequestHandler = asyncHandler(async (req, res) => {
  const data = await createUploadService(
    requireUserId(req),
    createUploadSchema.parse(req.body)
  )
  return sendSuccess(
    res,
    201,
    "Upload URL created",
    "MEDIA.UPLOAD_URL.CREATED",
    data
  )
})

export const completeUpload: RequestHandler = asyncHandler(async (req, res) => {
  const { key } = objectKeyInputSchema.parse(req.body)
  const data = await completeUploadService(requireUserId(req), key)
  return sendSuccess(
    res,
    200,
    "Upload completed",
    "MEDIA.UPLOAD.COMPLETED",
    data
  )
})

export const getOwnUploadUrl: RequestHandler = asyncHandler(
  async (req, res) => {
    const { key, fileName } = ownUploadUrlInputSchema.parse(req.query)
    const data = await getOwnUploadUrlService(
      requireUserId(req),
      key,
      fileName
    )
    return sendSuccess(
      res,
      200,
      "File URL created",
      "MEDIA.FILE_URL.CREATED",
      data
    )
  }
)

export const deleteOwnUpload: RequestHandler = asyncHandler(
  async (req, res) => {
    const { key } = objectKeyInputSchema.parse(req.body)
    const data = await deleteOwnUploadService(requireUserId(req), key)
    return sendSuccess(res, 200, "Upload deleted", "MEDIA.UPLOAD.DELETED", data)
  }
)

// Internal routes

export const signFileUrl: RequestHandler = asyncHandler(async (req, res) => {
  const data = await signFileUrlService(signFileUrlSchema.parse(req.body))
  return sendSuccess(
    res,
    200,
    "File URL created",
    "MEDIA.FILE_URL.CREATED",
    data
  )
})

export const signFileUrls: RequestHandler = asyncHandler(async (req, res) => {
  const { keys } = signFileUrlsSchema.parse(req.body)
  const data = await signFileUrlsService(keys)
  return sendSuccess(
    res,
    200,
    "File URLs created",
    "MEDIA.FILE_URLS.CREATED",
    data
  )
})

export const deleteFile: RequestHandler = asyncHandler(async (req, res) => {
  const { key } = objectKeyInputSchema.parse(req.body)
  const data = await deleteFileService(key)
  return sendSuccess(res, 200, "File deleted", "MEDIA.FILE.DELETED", data)
})
