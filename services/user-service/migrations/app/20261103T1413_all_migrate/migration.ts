#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2b185ed8dd0f3300ff697a352105e8b725690a8bed73d6153b30140c0b00534a/contract';
import endContract from '../../snapshots/2b185ed8dd0f3300ff697a352105e8b725690a8bed73d6153b30140c0b00534a/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a6f6940c734b6378e2742ef8dd19cc63dd7e769bec3faecfef8c8ce0b70e61f4/contract';
import startContract from '../../snapshots/a6f6940c734b6378e2742ef8dd19cc63dd7e769bec3faecfef8c8ce0b70e61f4/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'UserPermission',
        columns: [
          col('accessLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('countryCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('grantedByUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('moduleCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('moduleNameSnapshot', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sourceRequestId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'UserPermission_accessLevel_check_a8881806',
            sql`"accessLevel" IN ('VIEW', 'CREATE', 'EDIT', 'DELETE')`,
          ),
          checkExpression(
            'UserPermission_moduleCode_check_715d8229',
            sql`"moduleCode" IN ('COUNTRY_MANAGEMENT', 'USER_MANAGEMENT', 'ORGANIZATION_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'BILLING_MANAGEMENT', 'ANALYTICS_MANAGEMENT')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserPermission',
        index: 'UserPermission_country_module_793def4d',
        columns: ['countryCode', 'moduleCode'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserPermission',
        index: 'UserPermission_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserPermission',
        index: 'UserPermission_organization_key_0360ee30',
        columns: ['userId', 'organizationId', 'moduleCode', 'accessLevel'],
        extras: { where: sql`"organizationId" IS NOT NULL`, unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserPermission',
        index: 'UserPermission_platform_key_0dd62f6d',
        columns: ['userId', 'countryCode', 'moduleCode', 'accessLevel'],
        extras: { where: sql`"organizationId" IS NULL`, unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserPermission',
        index: 'UserPermission_sourceRequestId_idx_949a5766',
        columns: ['sourceRequestId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
