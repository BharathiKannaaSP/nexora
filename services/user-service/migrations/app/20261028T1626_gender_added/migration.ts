#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2f082350fb521626e82685d77efe43b549fa15f2a3393f2191e54708ecf0942e/contract';
import endContract from '../../snapshots/2f082350fb521626e82685d77efe43b549fa15f2a3393f2191e54708ecf0942e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7b5506693953c2a32c37fbf9aed38686029ee696e146dd1aab609422a7b084f6/contract';
import startContract from '../../snapshots/7b5506693953c2a32c37fbf9aed38686029ee696e146dd1aab609422a7b084f6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'UserProfile',
        column: col('gender', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'UserProfile',
        constraint: 'UserProfile_gender_check_87efb9de',
        expression: sql`"gender" IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
