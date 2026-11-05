#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3f46dc22a38865bbdcef2245256d6f3485dc851016053d6fbced1e8630564150/contract';
import startContract from '../../snapshots/3f46dc22a38865bbdcef2245256d6f3485dc851016053d6fbced1e8630564150/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/eb6ec3aa2ab526b970aae66cd47426df7f325c22919896ec560034940595cec7/contract';
import endContract from '../../snapshots/eb6ec3aa2ab526b970aae66cd47426df7f325c22919896ec560034940595cec7/contract.json' with { type: 'json' };
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
        table: 'ReviewerPermission',
        columns: [
          col('accessLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('countryCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('moduleCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'ReviewerPermission_accessLevel_check_a8881806',
            sql`"accessLevel" IN ('VIEW', 'CREATE', 'EDIT', 'DELETE')`,
          ),
          checkExpression(
            'ReviewerPermission_moduleCode_check_715d8229',
            sql`"moduleCode" IN ('COUNTRY_MANAGEMENT', 'USER_MANAGEMENT', 'ORGANIZATION_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'BILLING_MANAGEMENT', 'ANALYTICS_MANAGEMENT')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ReviewerPermissionSync',
        columns: [
          col('snapshotAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['userId'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'ReviewerPermission',
        constraint: 'ReviewerPermission_userId_countryCode_moduleCode_accessLevel_ke',
        columns: ['userId', 'countryCode', 'moduleCode', 'accessLevel'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ReviewerPermission',
        index: 'ReviewerPermission_moduleCode_accessLevel_idx_c568861c',
        columns: ['moduleCode', 'accessLevel'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
