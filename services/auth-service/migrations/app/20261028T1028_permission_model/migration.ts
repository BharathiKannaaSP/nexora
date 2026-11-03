#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/27e070e9b6cfc2a2dab732c187434df2582139b6b006c595d42f5342d2afca40/contract';
import startContract from '../../snapshots/27e070e9b6cfc2a2dab732c187434df2582139b6b006c595d42f5342d2afca40/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c3af7ac3be56a89ed4ae53bd34406794b74514cd2aecc022c404a517a034406b/contract';
import endContract from '../../snapshots/c3af7ac3be56a89ed4ae53bd34406794b74514cd2aecc022c404a517a034406b/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
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
        table: 'PermissionModule',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'PermissionModule',
        constraint: 'PermissionModule_code_key',
        columns: ['code'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PermissionModule',
        index: 'PermissionModule_isActive_idx_77fe3ba1',
        columns: ['isActive'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
