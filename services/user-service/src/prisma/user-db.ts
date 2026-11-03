// Node < 26.8.2 has no global Temporal; Prisma's temporal.updatedAt() and DateTime codecs need it.
import "temporal-polyfill/full/global"
import postgres, { type PostgresClient } from "@prisma/orm-postgres/runtime"
import { contractFromJson } from "@prisma/orm-postgres/static"
import { env } from "../config/user-env"
import type { Contract } from "./contract.d"
import contractJson from "./contract.json" with { type: "json" }

export const contract = contractFromJson<Contract>(contractJson)

export const db: PostgresClient<Contract> = postgres({
  contract,
  url: env.USER_DATABASE_URL,
})
