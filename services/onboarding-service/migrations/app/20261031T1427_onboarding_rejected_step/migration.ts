#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9a5179665df6d3bf225e7a4da060e22e7a4b2bee203fda738c700a92cf3c447e/contract';
import endContract from '../../snapshots/9a5179665df6d3bf225e7a4da060e22e7a4b2bee203fda738c700a92cf3c447e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e2a4a4937d080ac20b0e1244c15e9b6bfe19b22dd4787f797943d511a0ce2a18/contract';
import startContract from '../../snapshots/e2a4a4937d080ac20b0e1244c15e9b6bfe19b22dd4787f797943d511a0ce2a18/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Onboarding',
        constraint: 'Onboarding_currentStep_check_091f2e1e',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Onboarding',
        constraint: 'Onboarding_currentStep_check_3b21c466',
        expression: sql`"currentStep" IN ('BASIC_INFORMATION', 'CHOOSE_PATH', 'ROLE_REQUIREMENTS', 'REVIEW', 'COMPLETED')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
