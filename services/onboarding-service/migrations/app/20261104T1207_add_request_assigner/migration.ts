#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3f46dc22a38865bbdcef2245256d6f3485dc851016053d6fbced1e8630564150/contract';
import endContract from '../../snapshots/3f46dc22a38865bbdcef2245256d6f3485dc851016053d6fbced1e8630564150/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/3fd8b172e9e5be0bfa12ed4a3ab268a57065a44c75a4eb7039f54c21a48c3193/contract';
import startContract from '../../snapshots/3fd8b172e9e5be0bfa12ed4a3ab268a57065a44c75a4eb7039f54c21a48c3193/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'RequestAssignment',
        columns: [
          col('assignedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('assignedByUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('assignedToUserId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('requestId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requestType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RequestAssignment',
        index: 'RequestAssignment_assignedToUserId_assignedAt_idx_1777e945',
        columns: ['assignedToUserId', 'assignedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RequestAssignment',
        index: 'RequestAssignment_requestType_requestId_idx_6d279741',
        columns: ['requestType', 'requestId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
