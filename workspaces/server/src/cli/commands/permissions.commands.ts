import { Injectable } from '@nestjs/common';
import clc from 'cli-color';
import { randomUUID } from 'crypto';
import { RoutePermissions } from 'src/admin/roles/route-permissions.service';
import { ImportantRoles } from 'src/admin/roles/emums/important-roles.enum';
import { resolvePermissions } from 'unicore-common';
import { CommandDefinition, CommandOption } from '../command';
import { stdout } from '../stdout';

interface CheckOptions {
  url?: string;
  permission?: string;
  full?: boolean;
  routes?: boolean;
}

interface RouteResult {
  route: RoutePermissions;
  status: number;
  allowed: boolean;
  expected: boolean;
}

const SKIPPED_PATHS = ['/auth/logout', '/auth/refresh', '/auth/sessions_all', '/auth/sessions_other', '/auth/sessions/:uuid'];

const PATH_SAMPLES: Record<string, string> = {
  uuid: '00000000-0000-0000-0000-000000000000',
  id: '987654321',
  code: 'zz',
  entity: 'news',
  server: 'unicore-perms-check',
  username: 'unicore-perms-check',
  key: 'unicore.perms.check',
  type: 'news_created',
};

function fillPath(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => PATH_SAMPLES[name] ?? 'unicore-perms-check');
}

function expectAllowed(route: RoutePermissions, granted: string[]): boolean {
  if (route.superuser) return false;
  if (!route.permissions.length) return true;

  const matched = resolvePermissions(granted, route.permissions);

  return route.any ? matched.length > 0 : matched.length === route.permissions.length;
}

@Injectable()
export class PermissionsCheckCommand implements CommandDefinition {
  readonly name = 'perms-check';
  readonly description = 'Check permissions by granting them one at a time and walking the server routes';
  readonly arguments = '<username> <password>';
  readonly options: CommandOption[] = [
    { flags: '-u, --url <url>', description: 'server address, defaults to http://127.0.0.1:5000' },
    { flags: '-p, --permission <permission>', description: 'check a single permission only' },
    { flags: '-f, --full', description: 'full sweep: every permission against every route' },
    { flags: '-r, --routes', description: 'print the route map and exit' },
  ];

  private url = 'http://127.0.0.1:5000';
  private token = '';

  private async request(method: string, path: string, token: string, body?: unknown): Promise<{ status: number; data: any }> {
    const response = await fetch(`${this.url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
    });

    const text = await response.text();

    try {
      return { status: response.status, data: text ? JSON.parse(text) : null };
    } catch {
      return { status: response.status, data: text };
    }
  }

  private async login(username: string, password: string): Promise<string> {
    const { status, data } = await this.request('POST', '/auth/login', '', { username_or_email: username, password });

    if (status >= 400 || !data?.accessToken) throw new Error(`Вход под «${username}» не удался: ${status} ${JSON.stringify(data)}`);

    return data.accessToken;
  }

  private async probe(routes: RoutePermissions[], token: string, granted: string[]): Promise<RouteResult[]> {
    const results: RouteResult[] = [];

    for (const route of routes) {
      const { status } = await this.request(route.method, fillPath(route.path), token);

      results.push({
        route,
        status,
        allowed: status !== 403,
        expected: expectAllowed(route, granted),
      });
    }

    return results;
  }

  private report(title: string, results: RouteResult[]): number {
    const mismatched = results.filter((result) => result.allowed !== result.expected);

    if (!mismatched.length) {
      stdout(`${clc.green('✓')} ${title}: маршрутов проверено ${results.length}, расхождений нет`);

      return 0;
    }

    stdout(`${clc.red('✗')} ${title}: расхождений ${mismatched.length} из ${results.length}`);

    for (const { route, status, expected } of mismatched) {
      const requirement = route.permissions.length ? route.permissions.join(route.any ? ' или ' : ' и ') : 'без прав';
      const verdict = expected ? 'должен быть доступен, но закрыт' : 'должен быть закрыт, но доступен';

      stdout(`   ${clc.yellow(`${route.method} ${route.path}`)} — ${verdict} (${status}, требует: ${requirement})`);
    }

    return mismatched.length;
  }

  async run(inputs: string[], options: CheckOptions = {}): Promise<void> {
    this.url = (options.url || this.url).replace(/\/+$/, '');
    this.token = await this.login(inputs[0], inputs[1]);

    const routesResponse = await this.request('GET', '/admin/permissions/routes', this.token);

    if (routesResponse.status !== 200) throw new Error(`Карта маршрутов недоступна: ${routesResponse.status}`);

    const all: RoutePermissions[] = routesResponse.data;
    const routes = all.filter((route) => !route.public && !route.runtime && route.method !== 'ALL' && !SKIPPED_PATHS.includes(route.path));
    const runtime = all.filter((route) => route.runtime);

    if (options.routes) {
      for (const route of all) {
        const kind = route.public
          ? 'публичный'
          : route.superuser
          ? 'только суперпользователь'
          : route.runtime
          ? 'права проверяются в обработчике'
          : route.permissions.length
          ? route.permissions.join(route.any ? ' или ' : ' и ')
          : 'любой вошедший';

        stdout(`${route.method.padEnd(6)} ${route.path.padEnd(48)} ${kind}`);
      }

      return;
    }

    const rolesResponse = await this.request('GET', '/admin/roles', this.token);
    const defaultRole = (rolesResponse.data || []).find((role: any) => role.id === ImportantRoles.Default);
    const basePerms: string[] = defaultRole?.perms || [];

    const catalog = await this.request('GET', '/admin/permissions/catalog', this.token);
    const permissions: string[] = (catalog.data?.permissions || []).map((entry: { key: string }) => entry.key);

    const target = options.permission ? permissions.filter((permission) => permission === options.permission) : permissions;

    if (!target.length) throw new Error('Проверять нечего: ни одно право не подошло');

    const username = `pcheck_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const password = `Pc-${randomUUID()}`;

    const created = await this.request('POST', '/users', this.token, {
      username,
      email: `${username}@perms.check`,
      password,
      activated: true,
      roles: [ImportantRoles.Default],
      perms: [],
    });

    if (created.status >= 400) throw new Error(`Временный пользователь не создан: ${created.status} ${JSON.stringify(created.data)}`);

    const uuid = created.data.uuid;
    let mismatches = 0;

    try {
      stdout(`Маршрутов под правами: ${clc.magenta(String(routes.length))}, прав к проверке: ${clc.magenta(String(target.length))}`);
      stdout(' ');

      const token = await this.login(username, password);

      mismatches += this.report('Без единого права', await this.probe(routes, token, basePerms));

      const unused: string[] = [];
      const declared = new Set(routes.flatMap((route) => route.permissions));

      for (const permission of target) {
        const withDashboard = permission === 'panel.access' ? [permission] : ['panel.access', permission];
        const updated = await this.request('PATCH', `/users/${uuid}`, this.token, {
          username,
          email: `${username}@perms.check`,
          activated: true,
          roles: [ImportantRoles.Default],
          perms: withDashboard,
        });

        if (updated.status >= 400) {
          stdout(`${clc.red('✗')} Право ${permission}: выдать не удалось (${updated.status})`);
          mismatches += 1;
          continue;
        }

        const granted = [...basePerms, ...withDashboard];
        const baseline = [...basePerms, ...withDashboard.filter((value) => value !== permission)];
        const opened = routes.filter((route) => expectAllowed(route, granted) && !expectAllowed(route, baseline));
        const scope = options.full ? routes : opened;

        if (!opened.length) {
          if (!declared.has(permission)) unused.push(permission);

          if (!options.full) continue;
        }

        mismatches += this.report(`Право ${permission}`, await this.probe(scope, token, granted));
      }

      if (unused.length) {
        stdout(' ');
        stdout(`${clc.yellow('!')} Ни один маршрут их не требует, значит проверяются внутри обработчика: ${unused.join(', ')}`);
      }
    } finally {
      await this.request('DELETE', `/users/${uuid}`, this.token);
    }

    stdout(' ');

    if (runtime.length) {
      stdout(`Права проверяются внутри обработчика, обход пропущен: ${runtime.map((route) => `${route.method} ${route.path}`).join(', ')}`);
      stdout(' ');
    }

    if (mismatches) {
      stdout(clc.red(`Расхождений всего: ${mismatches}`));
      process.exitCode = 1;
    } else {
      stdout(clc.green('Права ведут себя так, как объявлены'));
    }
  }
}
