#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c6437f4327764f6abc60c11e34f4de342481a26f0fe421575334b112401abf42/contract';
import endContract from '../../snapshots/c6437f4327764f6abc60c11e34f4de342481a26f0fe421575334b112401abf42/contract.json' with { type: 'json' };
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
        table: 'Organization',
        columns: [
          col('address', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('countryCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdByUserId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('industry', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('logoObjectKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('size', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sourceRequestId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('taxDetails', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('website', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Organization_status_check_0f44f6b1',
            sql`"status" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'OrganizationMembership',
        columns: [
          col('approvedByUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('department', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('employeeId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jobTitle', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('joinedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('leftAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('organizationId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reportingManager', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sourceRequestId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('workEmail', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'OrganizationMembership_status_check_cb48dcff',
            sql`"status" IN ('ACTIVE', 'SUSPENDED', 'LEFT', 'REMOVED')`,
          ),
        ],
      }),
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
      this.addUnique({
        schema: 'public',
        table: 'Organization',
        constraint: 'Organization_slug_key',
        columns: ['slug'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Organization',
        constraint: 'Organization_sourceRequestId_key',
        columns: ['sourceRequestId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'OrganizationMembership',
        constraint: 'OrganizationMembership_sourceRequestId_key',
        columns: ['sourceRequestId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'OrganizationMembership',
        constraint: 'OrganizationMembership_organizationId_userId_key',
        columns: ['organizationId', 'userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Organization',
        index: 'Organization_countryCode_status_idx_3911eb6a',
        columns: ['countryCode', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Organization',
        index: 'Organization_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationMembership',
        index: 'OrganizationMembership_organizationId_idx_2e17ef41',
        columns: ['organizationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationMembership',
        index: 'OrganizationMembership_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationMembership',
        index: 'OrganizationMembership_userId_status_idx_e4a128ba',
        columns: ['userId', 'status'],
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
      this.addForeignKey({
        schema: 'public',
        table: 'OrganizationMembership',
        foreignKey: {
          name: 'OrganizationMembership_organizationId_fkey',
          columns: ['organizationId'],
          references: { schema: 'public', table: 'Organization', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
