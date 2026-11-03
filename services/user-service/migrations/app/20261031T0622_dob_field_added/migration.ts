#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2f082350fb521626e82685d77efe43b549fa15f2a3393f2191e54708ecf0942e/contract';
import startContract from '../../snapshots/2f082350fb521626e82685d77efe43b549fa15f2a3393f2191e54708ecf0942e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a6f6940c734b6378e2742ef8dd19cc63dd7e769bec3faecfef8c8ce0b70e61f4/contract';
import endContract from '../../snapshots/a6f6940c734b6378e2742ef8dd19cc63dd7e769bec3faecfef8c8ce0b70e61f4/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'UserProfile',
        column: col('dob', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
