import mysql from 'mysql2/promise';
import { database } from './env.mjs';

let pool = null;

function connection() {
  if (!pool) pool = mysql.createPool({ ...database, connectionLimit: 4, charset: 'utf8mb4' });

  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await connection().execute(sql, params);

  return rows;
}

export async function closeDatabase() {
  if (!pool) return;

  await pool.end();
  pool = null;
}

export async function makeSuperuser(username) {
  await query('UPDATE unicore_users SET superuser = 1, activated = 1, password_change_required = 0 WHERE username = ?', [username]);
}

export async function activate(username) {
  await query('UPDATE unicore_users SET activated = 1, password_change_required = 0 WHERE username = ?', [username]);
}

export async function removeUsers(prefix) {
  await query('DELETE FROM unicore_users WHERE username LIKE ?', [`${prefix}%`]);
}

export async function removeRoles(prefix) {
  await query('DELETE FROM unicore_roles WHERE id LIKE ?', [`${prefix}%`]);
}
