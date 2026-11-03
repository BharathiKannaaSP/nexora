#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7b5506693953c2a32c37fbf9aed38686029ee696e146dd1aab609422a7b084f6/contract';
import endContract from '../../snapshots/7b5506693953c2a32c37fbf9aed38686029ee696e146dd1aab609422a7b084f6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/83b1e7ee8bfa60d23b6b882739af50ffc4d84a14f98a03156dea43ff0a4d6c55/contract';
import startContract from '../../snapshots/83b1e7ee8bfa60d23b6b882739af50ffc4d84a14f98a03156dea43ff0a4d6c55/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
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
        table: 'UserProfile',
        columns: [
          col('addressLine1', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('addressLine2', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('bio', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('bioCountry', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('languageCode', 'text', {
            notNull: true,
            default: lit('en'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('phoneNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('postalCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('profileStatus', 'text', {
            notNull: true,
            default: lit('INCOMPLETE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('state', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('timezone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'UserProfile_profileStatus_check_36a9bbbb',
            sql`"profileStatus" IN ('INCOMPLETE', 'COMPLETE')`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'UserProfile',
        constraint: 'UserProfile_userId_key',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserProfile',
        index: 'UserProfile_bioCountry_idx_c4cc0997',
        columns: ['bioCountry'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'UserProfile',
        index: 'UserProfile_profileStatus_idx_7ec1bae3',
        columns: ['profileStatus'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
