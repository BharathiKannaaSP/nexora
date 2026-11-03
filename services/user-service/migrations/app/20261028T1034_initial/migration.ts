#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/83b1e7ee8bfa60d23b6b882739af50ffc4d84a14f98a03156dea43ff0a4d6c55/contract';
import endContract from '../../snapshots/83b1e7ee8bfa60d23b6b882739af50ffc4d84a14f98a03156dea43ff0a4d6c55/contract.json' with { type: 'json' };
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

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'OutboxEvent',
        columns: [
          col('aggregateId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('availableAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('eventType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('payload', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('publishedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'OutboxEvent_status_check_a6e9acdb',
            sql`"status" IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OutboxEvent',
        index: 'OutboxEvent_aggregateId_idx_c07c6552',
        columns: ['aggregateId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OutboxEvent',
        index: 'OutboxEvent_status_availableAt_idx_98697328',
        columns: ['status', 'availableAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
