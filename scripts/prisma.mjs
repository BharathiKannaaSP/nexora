// `pnpm prisma <args>` from the root. `pnpm prisma studio` opens Prisma Studio
// for every service's database at once; anything else goes to the Prisma CLI
// as usual.
//
// Prisma 8 has no Studio, so Studio runs from Prisma 7 (fetched by npx), given
// each service's database URL directly instead of its Prisma 8 config.

import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createServer } from "node:net"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

const STUDIO_PRISMA_VERSION = "7.10.1"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

// Each service reads its own URL from services/<name>/.env.
const SERVICES = [
  { name: "auth", envVar: "AUTH_DATABASE_URL", port: 5555 },
  { name: "user", envVar: "USER_DATABASE_URL", port: 5556 },
  { name: "onboarding", envVar: "ONBOARDING_DATABASE_URL", port: 5557 },
]

const [command, ...args] = process.argv.slice(2)

if (command !== "studio") {
  const child = spawn(
    join(root, "node_modules", ".bin", "prisma"),
    process.argv.slice(2),
    { stdio: "inherit" }
  )
  child.on("exit", (code) => process.exit(code ?? 1))
} else {
  // `pnpm prisma studio auth user` opens only those.
  const selected = args.length
    ? SERVICES.filter(({ name }) => args.includes(name))
    : SERVICES

  const readUrl = ({ name, envVar }) => {
    const envFile = join(root, "services", `${name}-service`, ".env")
    if (!existsSync(envFile)) return undefined
    return parseEnv(readFileSync(envFile, "utf8"))[envVar]
  }

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
