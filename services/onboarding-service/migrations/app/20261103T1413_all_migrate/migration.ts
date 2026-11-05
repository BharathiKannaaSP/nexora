#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3fd8b172e9e5be0bfa12ed4a3ab268a57065a44c75a4eb7039f54c21a48c3193/contract';
import endContract from '../../snapshots/3fd8b172e9e5be0bfa12ed4a3ab268a57065a44c75a4eb7039f54c21a48c3193/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9a5179665df6d3bf225e7a4da060e22e7a4b2bee203fda738c700a92cf3c447e/contract';
import startContract from '../../snapshots/9a5179665df6d3bf225e7a4da060e22e7a4b2bee203fda738c700a92cf3c447e/contract.json' with { type: 'json' };
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
        table: 'OrganizationDocumentRequirement',
        columns: [
          col('allowedMimeTypes', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('countryCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('documentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('isRequired', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('maxFileSizeBytes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('scope', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'OrganizationDocumentRequirement_documentType_check_669f20a4',
            sql`"documentType" IN ('ORGANIZATION_LOGO', 'TAX_DOCUMENT', 'BUSINESS_REGISTRATION', 'PROOF_OF_ADDRESS', 'IDENTITY_DOCUMENT', 'RESIDENCE_PERMIT', 'EMPLOYMENT_PROOF', 'OTHER')`,
          ),
          checkExpression(
            'OrganizationDocumentRequirement_scope_check_88908dc1',
            sql`"scope" IN ('CREATE_ORGANIZATION', 'JOIN_ORGANIZATION')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'OrganizationRequest',
        columns: [
          col('applicationRevision', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('department', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('employeeId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jobTitle', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('joiningDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('message', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('onboardingId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('organizationId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedAddress', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('proposedCountryCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedDescription', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedIndustry', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedLogoObjectKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedSize', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedSlug', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('proposedTaxDetails', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('proposedWebsite', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reportingManager', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
            'OrganizationRequest_status_check_5ccde6d9',
            sql`"status" IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN')`,
          ),
          checkExpression(
            'OrganizationRequest_type_check_69fa96ad',
            sql`"type" IN ('CREATE', 'JOIN')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        columns: [
          col('checksumSha256', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('contentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('documentType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('objectKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('originalFileName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requestId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requirementId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reviewComment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('reviewedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('reviewedByUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sizeBytes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
            'OrganizationRequestDocument_documentType_check_669f20a4',
            sql`"documentType" IN ('ORGANIZATION_LOGO', 'TAX_DOCUMENT', 'BUSINESS_REGISTRATION', 'PROOF_OF_ADDRESS', 'IDENTITY_DOCUMENT', 'RESIDENCE_PERMIT', 'EMPLOYMENT_PROOF', 'OTHER')`,
          ),
          checkExpression(
            'OrganizationRequestDocument_status_check_6d07363a',
            sql`"status" IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REUPLOAD_REQUIRED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'OrganizationRequestPermission',
        columns: [
          col('accessLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'OrganizationRequestPermission_accessLevel_check_a8881806',
            sql`"accessLevel" IN ('VIEW', 'CREATE', 'EDIT', 'DELETE')`,
          ),
          checkExpression(
            'OrganizationRequestPermission_moduleCode_check_715d8229',
            sql`"moduleCode" IN ('COUNTRY_MANAGEMENT', 'USER_MANAGEMENT', 'ORGANIZATION_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'BILLING_MANAGEMENT', 'ANALYTICS_MANAGEMENT')`,
          ),
        ],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        constraint: 'AdminAccessRequestPermission_accessLevel_check_a8881806',
        expression: sql`"accessLevel" IN ('VIEW', 'CREATE', 'EDIT', 'DELETE')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        constraint: 'AdminAccessRequestPermission_moduleCode_check_715d8229',
        expression: sql`"moduleCode" IN ('COUNTRY_MANAGEMENT', 'USER_MANAGEMENT', 'ORGANIZATION_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'BILLING_MANAGEMENT', 'ANALYTICS_MANAGEMENT')`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'OrganizationDocumentRequirement',
        constraint: 'OrganizationDocumentRequirement_countryCode_scope_code_key',
        columns: ['countryCode', 'scope', 'code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'OrganizationRequest',
        constraint: 'OrganizationRequest_onboardingId_applicationRevision_key',
        columns: ['onboardingId', 'applicationRevision'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'OrganizationRequestPermission',
        constraint: 'OrgReqPerm_req_module_access_key',
        columns: ['requestId', 'moduleCode', 'accessLevel'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationDocumentRequirement',
        index: 'OrgDocRequirement_countryCode_scope_isActive_idx_8b70a113',
        columns: ['countryCode', 'scope', 'isActive'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequest',
        index: 'OrganizationRequest_onboardingId_idx_68e25417',
        columns: ['onboardingId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequest',
        index: 'OrganizationRequest_organizationId_status_idx_21af5e82',
        columns: ['organizationId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequest',
        index: 'OrganizationRequest_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequest',
        index: 'OrganizationRequest_type_status_submittedAt_idx_9c385713',
        columns: ['type', 'status', 'submittedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequest',
        index: 'OrganizationRequest_userId_status_idx_e4a128ba',
        columns: ['userId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        index: 'OrganizationRequestDocument_requestId_idx_fd667f92',
        columns: ['requestId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        index: 'OrganizationRequestDocument_requestId_status_idx_176fef0f',
        columns: ['requestId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        index: 'OrganizationRequestDocument_requirementId_idx_fb134ad7',
        columns: ['requirementId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        index: 'OrganizationRequestDocument_reviewedByUserId_idx_e62d4e38',
        columns: ['reviewedByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrganizationRequestPermission',
        index: 'OrganizationRequestPermission_requestId_idx_fd667f92',
        columns: ['requestId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrganizationRequest',
        foreignKey: {
          name: 'OrganizationRequest_onboardingId_fkey',
          columns: ['onboardingId'],
          references: { schema: 'public', table: 'Onboarding', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        foreignKey: {
          name: 'OrganizationRequestDocument_requestId_fkey',
          columns: ['requestId'],
          references: { schema: 'public', table: 'OrganizationRequest', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        foreignKey: {
          name: 'OrganizationRequestDocument_requirementId_fkey',
          columns: ['requirementId'],
          references: {
            schema: 'public',
            table: 'OrganizationDocumentRequirement',
            columns: ['id'],
          },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrganizationRequestPermission',
        foreignKey: {
          name: 'OrganizationRequestPermission_requestId_fkey',
          columns: ['requestId'],
          references: { schema: 'public', table: 'OrganizationRequest', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
