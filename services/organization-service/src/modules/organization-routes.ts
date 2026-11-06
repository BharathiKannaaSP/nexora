import { Router } from "express"

import { createVerifyGateway } from "@nexora/shared/express/verify-gateway"

import { env } from "../config/organization-env"
import {
  getMyOrganizations,
  getOrganization,
  getOrganizationDirectory,
  getOrganizationDirectoryEntry,
} from "./organization-controller"

const verifyGateway = createVerifyGateway(env.INTERNAL_SERVICE_SECRET)

const router: Router = Router()

router.get("/my-organizations", verifyGateway, getMyOrganizations)
// Before "/:organizationId", which would otherwise match "directory".
router.get("/directory", verifyGateway, getOrganizationDirectory)
router.get(
  "/directory/:organizationId",
  verifyGateway,
  getOrganizationDirectoryEntry
)
router.get("/:organizationId", verifyGateway, getOrganization)

export default router
