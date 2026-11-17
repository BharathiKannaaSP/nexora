#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/6a586e031004b55f5b5d7609b4ecce12a24be59304bd72db4bede73164b61be1/contract';
import endContract from '../../snapshots/6a586e031004b55f5b5d7609b4ecce12a24be59304bd72db4bede73164b61be1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c3af7ac3be56a89ed4ae53bd34406794b74514cd2aecc022c404a517a034406b/contract';
import startContract from '../../snapshots/c3af7ac3be56a89ed4ae53bd34406794b74514cd2aecc022c404a517a034406b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('profileImageKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
