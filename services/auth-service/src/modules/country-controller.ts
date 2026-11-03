import { asyncHandler } from "@nexora/shared/express/async-handler"
import { sendSuccess } from "@nexora/shared/express/api-response"
import type { Request, RequestHandler, Response } from "express"
import { countryService } from "./country-service"

export const listCountries: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    // The list only changes when the package is upgraded.
    res.setHeader("Cache-Control", "public, max-age=86400")

    return sendSuccess(
      res,
      200,
      "Countries fetched",
      "AUTH.COUNTRIES.SUCCESS",
      { countries: countryService.listCountries() }
    )
  }
)
