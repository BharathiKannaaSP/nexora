import { config } from "@nexora/eslint-config/node"

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ["migrations/**", "src/prisma/contract.d.ts"],
  },
]
