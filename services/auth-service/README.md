| Command                                                 | Purpose                                       |
| ------------------------------------------------------- | --------------------------------------------- |
| `cd services/auth-service`                              | Enter the Auth Service                        |
| `pnpm add express dotenv zod`                           | Install backend runtime libraries             |
| `pnpm add @prisma/orm-postgres`                         | Add Prisma 8 PostgreSQL support               |
| `pnpm add -D typescript tsx @types/node @types/express` | Add TypeScript/dev tooling                    |
| `pnpm prisma --version`                                 | Check Prisma version                          |
| `pnpm prisma contract emit`                             | Generate artifacts from `contract.prisma`     |
| `pnpm prisma db sign`                                   | Associate/sign the database with the contract |
| `pnpm prisma db update`                                 | Apply the contract schema to PostgreSQL       |
| `pnpm prisma db verify`                                 | Confirm database matches the contract         |
