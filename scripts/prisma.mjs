// `pnpm prisma <args>` from the root, for every service at once. See
// docs/prisma.md.
//
// After changing a schema (emit, plan, migrate; snake_case name):
//   pnpm prisma migrate --name add_org_permissions
//   pnpm prisma migrate --name add_org_permissions user onboarding
//
// Single steps, run in every service's folder:
//   pnpm prisma contract emit
//   pnpm prisma migration plan --name add_org_permissions
//   pnpm prisma db migrate --advance-ref db
//   pnpm prisma migration status
//
// Studio and wiping data:
//   pnpm prisma studio              # every database
//   pnpm prisma studio user         # just that one
//   pnpm prisma drop                # delete all rows; asks first
//   pnpm prisma drop onboarding -y  # -y skips the question
//
// Services: auth, user, onboarding, organization. A single step for one
// service: cd services/<name>-service && pnpm prisma <args>.
//
// Prisma 8 has no Studio, so Studio runs from Prisma 7 (fetched by npx), given
// each service's database URL directly instead of its Prisma 8 config.

import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:net"
import { dirname, join } from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

const STUDIO_PRISMA_VERSION = "7.10.1"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// Each service reads its own URL from services/<name>/.env.
const SERVICES = [
  { name: "auth", envVar: "AUTH_DATABASE_URL", port: 5555 },
  { name: "user", envVar: "USER_DATABASE_URL", port: 5556 },
  { name: "onboarding", envVar: "ONBOARDING_DATABASE_URL", port: 5557 },
  { name: "organization", envVar: "ORGANIZATION_DATABASE_URL", port: 5558 },
]

const [command, ...args] = process.argv.slice(2)

// `pnpm prisma studio auth user` / `pnpm prisma drop auth user` act on only
// those. The value after --name is the migration's name, not a service.
const names = args.filter(
  (arg, i) => !arg.startsWith("-") && args[i - 1] !== "--name"
)
const selected = names.length
  ? SERVICES.filter(({ name }) => names.includes(name))
  : SERVICES

// Runs the Prisma CLI in the service's folder, so it picks up that service's
// prisma.config.ts and .env; there is none at the root.
const runPrisma = ({ name }, prismaArgs) => {
  const cwd = join(root, "services", `${name}-service`)
  const ownBin = join(cwd, "node_modules", ".bin", "prisma")
  const bin = existsSync(ownBin)
    ? ownBin
    : join(root, "node_modules", ".bin", "prisma")

  console.log(`\n[${name}] prisma ${prismaArgs.join(" ")}`)
  const result = spawnSync(bin, prismaArgs, { cwd, stdio: "inherit" })
  if (result.error || result.status !== 0) {
    console.error(
      `[${name}] failed at "prisma ${prismaArgs.join(" ")}"` +
        (result.error ? `: ${result.error.message}` : "")
    )
    return false
  }
  return true
}

const readUrl = ({ name, envVar }) => {
  const envFile = join(root, "services", `${name}-service`, ".env")
  if (!existsSync(envFile)) return undefined
  return parseEnv(readFileSync(envFile, "utf8"))[envVar]
}

if (command === "drop") {
  // Empties every table in each service's schema; the tables themselves and
  // Prisma's own prisma_contract schema are left alone. Needs psql on PATH.
  if (!args.includes("-y") && !args.includes("--yes")) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(
      `Delete all data in ${selected.map(({ name }) => name).join(", ")}? (y/N) `
    )
    rl.close()
    if (answer.trim().toLowerCase() !== "y") process.exit(1)
  }

  let failed = false
  for (const service of selected) {
    const url = readUrl(service)
    if (!url) {
      console.warn(`[${service.name}] skipped: no ${service.envVar} in .env`)
      continue
    }

    // psql rejects Prisma's ?schema= parameter, so take it out and use it as
    // the schema to empty.
    const parsed = new URL(url)
    const schema = parsed.searchParams.get("schema") ?? "public"
    parsed.searchParams.delete("schema")

    const sql = `
      DO $$
      DECLARE tables text;
      BEGIN
        SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
          INTO tables
          FROM pg_tables
          WHERE schemaname = '${schema.replaceAll("'", "''")}';
        IF tables IS NOT NULL THEN
          EXECUTE 'TRUNCATE ' || tables || ' RESTART IDENTITY CASCADE';
        END IF;
        RAISE NOTICE 'emptied: %', coalesce(tables, 'no tables');
      END $$;
    `
    const result = spawnSync(
      "psql",
      [parsed.toString(), "-v", "ON_ERROR_STOP=1", "-qc", sql],
      { encoding: "utf8" }
    )
    if (result.error || result.status !== 0) {
      failed = true
      console.error(
        `[${service.name}] failed: ${(result.error?.message ?? result.stderr).trim()}`
      )
    } else {
      console.log(
        `[${service.name}] ${result.stderr.replace(/^NOTICE:\s*/, "").trim()}`
      )
    }
  }
  process.exit(failed ? 1 : 0)
} else if (command === "migrate") {
  // `pnpm prisma migrate --name org_changes` (or `--name=org_changes`), with
  // service names to act on only those. Each service runs the steps in its own
  // folder, so Prisma picks up its prisma.config.ts and .env.
  const nameIndex = args.indexOf("--name")
  const migrationName =
    nameIndex === -1
      ? args.find((arg) => arg.startsWith("--name="))?.slice("--name=".length)
      : args[nameIndex + 1]

  if (!migrationName || migrationName.startsWith("-")) {
    console.error(
      "Usage: pnpm prisma migrate --name <migration_name> [service...]"
    )
    process.exit(1)
  }

  const steps = [
    ["contract", "emit"],
    ["migration", "plan", "--name", migrationName],
    ["db", "migrate", "--advance-ref", "db"],
  ]

  // every() stops at the first failed step: a later one would run against a
  // stale or missing migration.
  const failedServices = selected
    .filter((service) => !steps.every((step) => runPrisma(service, step)))
    .map(({ name }) => name)

  console.log(
    failedServices.length
      ? `\nFailed: ${failedServices.join(", ")}`
      : `\nMigrated: ${selected.map(({ name }) => name).join(", ")}`
  )
  process.exit(failedServices.length ? 1 : 0)
} else if (command !== "studio") {
  // Any other command, e.g. `pnpm prisma contract emit`, runs as given in
  // every service. Its arguments are Prisma's, so it can't take service names;
  // for one service, run `pnpm prisma <args>` inside services/<name>-service.
  const failedServices = SERVICES.filter(
    (service) => !runPrisma(service, process.argv.slice(2))
  ).map(({ name }) => name)

  if (failedServices.length) {
    console.log(`\nFailed: ${failedServices.join(", ")}`)
  }
  process.exit(failedServices.length ? 1 : 0)
} else {
  const isFree = (port) =>
    new Promise((resolve) => {
      const server = createServer()
        .once("error", () => resolve(false))
        .once("listening", () => server.close(() => resolve(true)))
        .listen(port, "127.0.0.1")
    })

  // A Studio left running elsewhere may hold the usual port; take the next
  // free one, skipping those already handed out.
  const taken = new Set()
  const freePort = async (port) => {
    while (taken.has(port) || !(await isFree(port))) port++
    taken.add(port)
    return port
  }

  const children = []
  for (const service of selected) {
    const url = readUrl(service)
    if (!url) {
      console.warn(`[${service.name}] skipped: no ${service.envVar} in .env`)
      continue
    }
    const port = await freePort(service.port)

    // Run outside the service folder so Prisma 7 doesn't pick up its
    // Prisma 8 prisma.config.ts.
    const child = spawn(
      "npx",
      [
        "-y",
        `prisma@${STUDIO_PRISMA_VERSION}`,
        "studio",
        "--url",
        url,
        "--port",
        String(port),
      ],
      // Its own process group, so stopAll also reaches the Studio npx starts.
      { cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: true }
    )

    const prefix = (stream, out) =>
      stream.on("data", (chunk) =>
        chunk
          .toString()
          .split("\n")
          .filter(Boolean)
          .forEach((line) => out.write(`[${service.name}] ${line}\n`))
      )
    prefix(child.stdout, process.stdout)
    prefix(child.stderr, process.stderr)
    child.on("exit", (code) =>
      console.log(`[${service.name}] Studio exited (${code ?? "signal"})`)
    )

    console.log(`[${service.name}] Studio on http://localhost:${port}`)
    children.push(child)
  }

  if (children.length === 0) process.exit(1)

  const stopAll = () => {
    for (const child of children) {
      try {
        process.kill(-child.pid, "SIGTERM")
      } catch {
        // Already gone.
      }
    }
    process.exit(0)
  }
  process.on("SIGINT", stopAll)
  process.on("SIGTERM", stopAll)
}
