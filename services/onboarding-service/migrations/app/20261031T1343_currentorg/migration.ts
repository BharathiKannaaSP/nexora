#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9a5179665df6d3bf225e7a4da060e22e7a4b2bee203fda738c700a92cf3c447e/contract';
import endContract from '../../snapshots/9a5179665df6d3bf225e7a4da060e22e7a4b2bee203fda738c700a92cf3c447e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cb9c40aa4f7acc587aa7e2bd4a8212a56ca8d08c13b359378172919711a6ac51/contract';
import startContract from '../../snapshots/cb9c40aa4f7acc587aa7e2bd4a8212a56ca8d08c13b359378172919711a6ac51/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.setNotNull({
        schema: 'public',
        table: 'AdminAccessRequest',
        column: 'currentOrganizationName',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
