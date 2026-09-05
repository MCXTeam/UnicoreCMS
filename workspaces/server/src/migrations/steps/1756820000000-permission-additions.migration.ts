import { Permission, anyScope, denyTarget, isDenyPattern, longestScope, satisfiesPermission } from 'unicore-common';
import { MigrationInterface, QueryRunner } from 'typeorm';

const COLUMNS: [table: string, column: string, key: string][] = [
  ['unicore_roles', 'perms', 'id'],
  ['unicore_users', 'perms', 'uuid'],
];

const FLATTENED: Permission[] = ['panel.mods.read', 'panel.mods.update', 'panel.mods.delete.many', 'panel.mods.delete'];

type GrantMode = 'any' | 'exact' | 'mirror';

interface Grant {
  granted: Permission;
  implied: Permission[];
  mode: GrantMode;
}

const GRANTS: Grant[] = [
  { granted: 'panel.pages.read', implied: ['panel.pages.create', 'panel.pages.update', 'panel.pages.delete'], mode: 'exact' },
  { granted: 'panel.servers.sort', implied: ['panel.servers.update'], mode: 'exact' },
  { granted: 'panel.servers.issuance', implied: ['panel.servers.rcon'], mode: 'any' },
  {
    granted: 'panel.donate.sort',
    implied: ['panel.donate.groups.update', 'panel.donate.permissions.update', 'panel.donate.kits.update'],
    mode: 'any',
  },
  { granted: 'panel.store.kits.field.price', implied: ['panel.store.kits.update'], mode: 'any' },
  { granted: 'panel.revenue.access', implied: ['panel.revenue.read'], mode: 'any' },
  { granted: 'panel.revenue.items', implied: ['panel.revenue.read'], mode: 'mirror' },
  { granted: 'panel.users.skin', implied: ['panel.users.update'], mode: 'exact' },
  { granted: 'panel.users.cloak', implied: ['panel.users.update'], mode: 'exact' },
  { granted: 'panel.roles.grant.panel', implied: ['panel.users.grant.panel'], mode: 'exact' },
];

function flatten(pattern: string): string {
  const negative = isDenyPattern(pattern);
  const target = denyTarget(pattern);
  const base = longestScope(target, FLATTENED);

  if (!base) return pattern;

  return negative ? `!${base}` : base;
}

function mirrored(perms: string[], granted: Permission, source: Permission): string[] {
  if (satisfiesPermission(perms, source)) return [granted];

  const prefix = `${source}.`;

  return perms
    .filter((pattern) => !isDenyPattern(pattern) && pattern.startsWith(prefix) && !pattern.includes('*'))
    .map((pattern) => `${granted}.${pattern.slice(prefix.length)}`);
}

function additions(perms: string[]): string[] {
  const added: string[] = [];

  for (const { granted, implied, mode } of GRANTS) {
    if (satisfiesPermission(perms, granted)) continue;

    if (mode === 'mirror') {
      added.push(...implied.flatMap((source) => mirrored(perms, granted, source)));

      continue;
    }

    const matched = implied.some((permission) => satisfiesPermission(perms, mode === 'any' ? anyScope(permission) : permission));

    if (matched) added.push(granted);
  }

  return added;
}

export class PermissionAdditions1756820000000 implements MigrationInterface {
  name = 'PermissionAdditions1756820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [name, column, key] of COLUMNS) {
      const table = await queryRunner.getTable(name);

      if (!table?.findColumnByName(column)) continue;

      const rows: Record<string, any>[] = await queryRunner.query(
        `SELECT \`${key}\` AS row_key, \`${column}\` AS value FROM \`${name}\` WHERE \`${column}\` IS NOT NULL AND \`${column}\` <> ''`,
      );

      for (const row of rows) {
        const before = String(row.value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

        const perms = Array.from(new Set(before.map(flatten)));
        const after = Array.from(new Set([...perms, ...additions(perms)]));

        if (before.join(',') === after.join(',')) continue;

        await queryRunner.query(`UPDATE \`${name}\` SET \`${column}\` = ? WHERE \`${key}\` = ?`, [after.join(','), row.row_key]);
      }
    }
  }

  public async down(): Promise<void> {
    return;
  }
}
