#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/cb9c40aa4f7acc587aa7e2bd4a8212a56ca8d08c13b359378172919711a6ac51/contract';
import startContract from '../../snapshots/cb9c40aa4f7acc587aa7e2bd4a8212a56ca8d08c13b359378172919711a6ac51/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e2a4a4937d080ac20b0e1244c15e9b6bfe19b22dd4787f797943d511a0ce2a18/contract';
import endContract from '../../snapshots/e2a4a4937d080ac20b0e1244c15e9b6bfe19b22dd4787f797943d511a0ce2a18/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Onboarding',
        constraint: 'Onboarding_currentStep_check_3b21c466',
      }),
      this.setNotNull({
        schema: 'public',
        table: 'AdminAccessRequest',
        column: 'currentOrganizationName',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Onboarding',
        constraint: 'Onboarding_currentStep_check_091f2e1e',
        expression: sql`"currentStep" IN ('BASIC_INFORMATION', 'CHOOSE_PATH', 'ROLE_REQUIREMENTS', 'REVIEW', 'REJECTED', 'COMPLETED')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
