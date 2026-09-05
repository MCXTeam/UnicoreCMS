import { login, register, session } from './api.mjs';
import { activate, makeSuperuser, query, removeRoles, removeUsers } from './db.mjs';

export const PASSWORD = 'Qx7!vLm2#Rt9wZ';

export const ROOT_USERNAME = 'e2eroot';

export const USER_PREFIX = 'e2eu';

export const ROLE_PREFIX = 'etest';

const letters = 'abcdefghijklmnopqrstuvwxyz';

const randomLetters = (length) => Array.from({ length }, () => letters[Math.floor(Math.random() * letters.length)]).join('');

let root = null;

const createdUsers = [];

const createdRoles = [];

export function uniqueUsername() {
  return `${USER_PREFIX}${randomLetters(8)}`;
}

export function uniqueRoleId() {
  return `${ROLE_PREFIX}${randomLetters(8)}`;
}

export async function rootSession() {
  if (root) return root;

  try {
    root = await login(ROOT_USERNAME, PASSWORD);
  } catch {
    await register(ROOT_USERNAME, PASSWORD).catch(() => null);
    await makeSuperuser(ROOT_USERNAME);
    root = await login(ROOT_USERNAME, PASSWORD);
  }

  await makeSuperuser(ROOT_USERNAME);

  return root;
}

export async function createRole(perms, extra = {}) {
  const admin = await rootSession();
  const id = uniqueRoleId();

  const { status, body } = await admin.post('/admin/roles', {
    id,
    name: `Тестовая роль ${id}`,
    perms,
    priority: 1,
    ...extra,
  });

  if (status !== 200 && status !== 201) throw new Error(`роль не создана: ${status} ${JSON.stringify(body)}`);

  createdRoles.push(id);

  return id;
}

export async function createUser({ perms = [], roles = [], superuser = false } = {}) {
  const admin = await rootSession();
  const username = uniqueUsername();

  const { status, body } = await admin.post('/users', {
    username,
    email: `${username}@example.com`,
    password: PASSWORD,
    activated: true,
    superuser,
    perms,
    roles,
  });

  if (status !== 200 && status !== 201) throw new Error(`пользователь не создан: ${status} ${JSON.stringify(body)}`);

  createdUsers.push(username);

  await activate(username);

  return { username, session: await login(username, PASSWORD) };
}

export async function createAdmin(perms) {
  return createUser({ perms: ['panel.access', ...perms] });
}

export async function anonymous() {
  return session();
}

export async function cleanup() {
  for (const username of createdUsers) {
    await query('DELETE FROM unicore_users WHERE username = ?', [username]).catch(() => null);
  }

  for (const id of createdRoles) {
    await query('DELETE FROM unicore_roles WHERE id = ?', [id]).catch(() => null);
  }

  createdUsers.length = 0;
  createdRoles.length = 0;
}

export async function cleanupLeftovers() {
  await removeUsers(USER_PREFIX).catch(() => null);
  await removeRoles(ROLE_PREFIX).catch(() => null);
}
