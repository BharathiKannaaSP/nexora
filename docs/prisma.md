# Prisma commands

Each service has its own database, schema (`src/prisma/contract.prisma`) and
`prisma.config.ts`. [`scripts/prisma.mjs`](../scripts/prisma.mjs) runs Prisma
for all of them from the repo root, so run every command below from there.

Services: `auth`, `user`, `onboarding`, `organization`.

## After changing a schema

```bash
pnpm prisma migrate --name add_org_permissions
```

For each service this runs, in its own folder:

1. `prisma contract emit`: updates `contract.json` and `contract.d.ts`
2. `prisma migration plan --name <name>`: writes the migration
3. `prisma db migrate --advance-ref db`: applies it to the database

A service stops at its first failed step; the others still run, and the
failed ones are listed at the end. Use snake_case for the name.

To run it for only the services you changed:

```bash
pnpm prisma migrate --name add_org_permissions user onboarding organization
```

## Single steps

These run in every service:

```bash
pnpm prisma contract emit
pnpm prisma migration plan --name add_org_permissions
pnpm prisma db migrate --advance-ref db
pnpm prisma migration status
```

They can't take service names, because the arguments go to Prisma as they
are. For one service, run them inside its folder:

```bash
cd services/user-service
pnpm prisma contract emit
```

## Studio and wiping data

```bash
pnpm prisma studio                 # Studio for every database
pnpm prisma studio user            # just that one
pnpm prisma drop                   # delete all rows, asks first
pnpm prisma drop onboarding -y     # -y skips the question
```

Prisma 8 has no Studio, so `studio` runs Prisma 7's. `drop` empties the
tables but keeps them, and needs `psql` on your PATH.

## First-time setup

Each database must exist before its first migration:

```bash
createdb nexora_organization
```

The database URLs are in each service's `.env` (`AUTH_DATABASE_URL`,
`USER_DATABASE_URL`, `ONBOARDING_DATABASE_URL`,
`ORGANIZATION_DATABASE_URL`).
