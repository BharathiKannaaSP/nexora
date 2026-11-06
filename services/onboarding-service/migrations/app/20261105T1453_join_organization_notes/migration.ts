#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c2ef3c3f4b48c90b09b4fd2cfac9008555f5d91a4dbc32eb6b2ad119e034fc42/contract';
import endContract from '../../snapshots/c2ef3c3f4b48c90b09b4fd2cfac9008555f5d91a4dbc32eb6b2ad119e034fc42/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/eb6ec3aa2ab526b970aae66cd47426df7f325c22919896ec560034940595cec7/contract';
import startContract from '../../snapshots/eb6ec3aa2ab526b970aae66cd47426df7f325c22919896ec560034940595cec7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'OrganizationDocumentRequirement',
        constraint: 'OrganizationDocumentRequirement_documentType_check_669f20a4',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        constraint: 'OrganizationRequestDocument_documentType_check_669f20a4',
      }),
      this.addColumn({
        schema: 'public',
        table: 'OrganizationRequest',
        column: col('additionalNotes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'OrganizationDocumentRequirement',
        constraint: 'OrganizationDocumentRequirement_documentType_check_f2925b67',
        expression: sql`"documentType" IN ('ORGANIZATION_LOGO', 'TAX_DOCUMENT', 'BUSINESS_REGISTRATION', 'PROOF_OF_ADDRESS', 'IDENTITY_DOCUMENT', 'RESIDENCE_PERMIT', 'EMPLOYMENT_PROOF', 'OFFER_LETTER', 'OTHER')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'OrganizationRequestDocument',
        constraint: 'OrganizationRequestDocument_documentType_check_f2925b67',
        expression: sql`"documentType" IN ('ORGANIZATION_LOGO', 'TAX_DOCUMENT', 'BUSINESS_REGISTRATION', 'PROOF_OF_ADDRESS', 'IDENTITY_DOCUMENT', 'RESIDENCE_PERMIT', 'EMPLOYMENT_PROOF', 'OFFER_LETTER', 'OTHER')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
