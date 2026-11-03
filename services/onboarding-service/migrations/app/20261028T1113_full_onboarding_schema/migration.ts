#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/4cd9468fe0580d8eec5b8e93cc7831eb355cd2df9df069f21bb75299a6fbf194/contract';
import endContract from '../../snapshots/4cd9468fe0580d8eec5b8e93cc7831eb355cd2df9df069f21bb75299a6fbf194/contract.json' with { type: 'json' };
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
        table: 'AdminAccessRequest',
        columns: [
          col('applicationRevision', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('currentOrganizationName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('department', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jobTitle', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('justification', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('onboardingId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reviewComment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reviewedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('reviewedByUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('submittedAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'AdminAccessRequest_status_check_5ccde6d9',
            sql`"status" IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        columns: [
          col('accessLevel', 'text', {
            notNull: true,
            default: lit('READ'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('moduleCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('moduleNameSnapshot', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('requestId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Onboarding',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('currentStep', 'text', {
            notNull: true,
            default: lit('BASIC_INFORMATION'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rejectedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('rejectionReason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('revision', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('selectedPath', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('submittedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Onboarding_currentStep_check_3b21c466',
            sql`"currentStep" IN ('BASIC_INFORMATION', 'CHOOSE_PATH', 'ROLE_REQUIREMENTS', 'REVIEW', 'COMPLETED')`,
          ),
          checkExpression(
            'Onboarding_selectedPath_check_6f2c7f99',
            sql`"selectedPath" IN ('BECOME_ADMIN', 'CREATE_ORGANIZATION', 'JOIN_ORGANIZATION')`,
          ),
          checkExpression(
            'Onboarding_status_check_8658aca4',
            sql`"status" IN ('PENDING', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED', 'REJECTED')`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'AdminAccessRequest',
        constraint: 'AdminAccessRequest_onboardingId_applicationRevision_key',
        columns: ['onboardingId', 'applicationRevision'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        constraint: 'AdminAccessRequestPermission_requestId_moduleCode_accessLevel_k',
        columns: ['requestId', 'moduleCode', 'accessLevel'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Onboarding',
        constraint: 'Onboarding_userId_key',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequest',
        index: 'AdminAccessRequest_onboardingId_idx_68e25417',
        columns: ['onboardingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequest',
        index: 'AdminAccessRequest_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequest',
        index: 'AdminAccessRequest_status_submittedAt_idx_0938dd64',
        columns: ['status', 'submittedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequest',
        index: 'AdminAccessRequest_userId_status_idx_e4a128ba',
        columns: ['userId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        index: 'AdminAccessRequestPermission_moduleCode_idx_b27c7c04',
        columns: ['moduleCode'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        index: 'AdminAccessRequestPermission_requestId_idx_fd667f92',
        columns: ['requestId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Onboarding',
        index: 'Onboarding_selectedPath_idx_a9f810ab',
        columns: ['selectedPath'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Onboarding',
        index: 'Onboarding_status_currentStep_idx_e7419174',
        columns: ['status', 'currentStep'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AdminAccessRequest',
        foreignKey: {
          name: 'AdminAccessRequest_onboardingId_fkey',
          columns: ['onboardingId'],
          references: { schema: 'public', table: 'Onboarding', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        foreignKey: {
          name: 'AdminAccessRequestPermission_requestId_fkey',
          columns: ['requestId'],
          references: { schema: 'public', table: 'AdminAccessRequest', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
