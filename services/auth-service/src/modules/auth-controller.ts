import {
  createSignUpSchema,
  resendVerificationSchema,
  signUpLocaleSchema,
  verifyEmailSchema,
} from "@nexora/schemas/auth/sign-up"
import { asyncHandler } from "@nexora/shared/express/async-handler"
import type { Request, RequestHandler, Response } from "express"
import { authService } from "./auth-service"
import { sendSuccess } from "@nexora/shared/express/api-response"
import { createSignInSchema } from "@nexora/schemas/auth/sign-in"
import { createUpdateMeSchema } from "@nexora/schemas/auth/update-me"
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
} from "@nexora/shared/constants/auth"
import { refreshCookieOptions } from "../lib/helpers/refresh-token"
import { AppError } from "@nexora/shared/express/app-error"

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const signUpSchema = createSignUpSchema(
      {} as Parameters<typeof createSignUpSchema>[0]
    )
    const input = signUpSchema.parse(req.body)
    const localeInfo = signUpLocaleSchema.parse(req.body)
    const user = await authService.register(input, localeInfo)

    return sendSuccess(
      res,
      201,
      "Account created successfully",
      "AUTH.REGISTER.SUCCESS",
      { user }
    )
  }
)

export const verifyEmail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = verifyEmailSchema.parse(req.body)

    const result = await authService.verifyEmail(input.token)

    return sendSuccess(
      res,
      200,
      "Email verified successfully",
      "AUTH.VERIFY_EMAIL.SUCCESS",
      { result }
    )
  }
)

export const resendVerification: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = resendVerificationSchema.parse(req.body)

    await authService.resendVerification(input.identifier)

    // Same response whether or not an email was sent, so the endpoint can't
    // be used to discover which accounts exist.
    return sendSuccess(
      res,
      200,
      "If the account needs verification, a new email has been sent",
      "AUTH.RESEND_VERIFICATION.SUCCESS",
      null
    )
  }
)

export const signIn: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const signInSchema = createSignInSchema(
      {} as Parameters<typeof createSignInSchema>[0]
    )
    const input = signInSchema.parse(req.body)

    const result = await authService.signIn(input)

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions)

    const { refreshToken: _refreshToken, ...responseData } = result

    return sendSuccess(
      res,
      200,
      "Signed in successfully",
      "AUTH.SIGN_IN.SUCCESS",
      responseData
    )
  }
)

export const refresh: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]

    if (typeof refreshToken !== "string") {
      throw new AppError(
        "Refresh token is required",
        401,
        "REFRESH_TOKEN_REQUIRED"
      )
    }

    const result = await authService.refresh(refreshToken)

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions)

    return sendSuccess(
      res,
      200,
      "Token refreshed successfully",
      "AUTH.REFRESH.SUCCESS",
      {
        accessToken: result.accessToken,
        tokenType: "Bearer",
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }
    )
  }
)

export const me: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // Set by the gateway after it verifies the access token.
    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError(
        "Access token is required",
        401,
        "ACCESS_TOKEN_REQUIRED"
      )
    }

    const user = await authService.getCurrentUser(userId)

    return sendSuccess(
      res,
      200,
      "Current user fetched successfully",
      "AUTH.ME.SUCCESS",
      { user }
    )
  }
)

export const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME]

    await authService.logout(
      typeof refreshToken === "string" ? refreshToken : undefined
    )

    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...refreshCookieOptions,
      maxAge: undefined,
    })

    return sendSuccess(
      res,
      200,
      "Logged out successfully",
      "AUTH.LOGOUT.SUCCESS",
      null
    )
  }
)

export const updateMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const updateMeSchema = createUpdateMeSchema(
      {} as Parameters<typeof createUpdateMeSchema>[0]
    )
    const input = updateMeSchema.parse(req.body)

    const userId = req.headers["x-user-id"]

    if (typeof userId !== "string" || !userId) {
      throw new AppError(
        "Access token is required",
        401,
        "ACCESS_TOKEN_REQUIRED"
      )
    }

    const user = await authService.updateMe(input, userId)

    return sendSuccess(
      res,
      200,
      "Account updated successfully",
      "AUTH.UPDATED.SUCCESS",
      { user }
    )
  }
)
