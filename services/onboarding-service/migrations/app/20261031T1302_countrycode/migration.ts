#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/4cd9468fe0580d8eec5b8e93cc7831eb355cd2df9df069f21bb75299a6fbf194/contract';
import startContract from '../../snapshots/4cd9468fe0580d8eec5b8e93cc7831eb355cd2df9df069f21bb75299a6fbf194/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cb9c40aa4f7acc587aa7e2bd4a8212a56ca8d08c13b359378172919711a6ac51/contract';
import endContract from '../../snapshots/cb9c40aa4f7acc587aa7e2bd4a8212a56ca8d08c13b359378172919711a6ac51/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        constraint: 'AdminAccessRequestPermission_requestId_moduleCode_accessLevel_k',
      }),
      this.dropDefault({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        column: 'accessLevel',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        index: 'AdminAccessRequestPermission_moduleCode_idx_b27c7c04',
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        column: 'countryCode',
        type: 'text',
      }),
      this.addUnique({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        constraint: 'AdminAccessReqPerm_req_country_module_access_key',
        columns: ['requestId', 'countryCode', 'moduleCode', 'accessLevel'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminAccessRequestPermission',
        index: 'AdminAccessReqPerm_country_module_793def4d',
        columns: ['countryCode', 'moduleCode'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
