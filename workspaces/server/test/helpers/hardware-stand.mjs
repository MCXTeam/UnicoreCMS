import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { api } from './env.mjs';
import { createUser, PASSWORD, rootSession } from './stand.mjs';
import { query } from './db.mjs';

export async function hardwareStand() {
  const root = await rootSession();
  const player = await createUser(), second = await createUser();
  const uuid = (await player.session.get('/auth/me')).body.user.uuid;
  const secondUuid = (await second.session.get('/auth/me')).body.user.uuid;
  const token = await root.post('/admin/api', { comment: `hardware-contract-${uuid}`, perms: ['kernel.provider'], allow: ['127.0.0.1', '::1'] });
  assert.equal(token.status, 201);
  const kernel = async (path, body, options = {}) => {
    const response = await fetch(`${api}/auth/gravit${path}`, { method: body == null ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Api-Key ${token.body.key}`, ...(options.headers || {}) }, ...(body == null ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    const result = { status: response.status, body: text ? JSON.parse(text) : null };
    if (options.expected != null) assert.equal(result.status, options.expected, `${path}: ${JSON.stringify(result.body)}`);
    return result;
  };
  const authorize = async (user = player, required = true) => {
    const result = await kernel('/authorize', { login: user.username, password: { password: PASSWORD }, minecraftAccess: true, hardwareRequired: required }, { expected: 201 });
    return result.body;
  };
  const serial = randomBytes(10).toString('hex');
  const info = { bitness: 64, totalMemory: 32 * 1073741824, logicalProcessors: 16, physicalProcessors: 8, processorMaxFreq: 4_500_000_000, battery: false, hwDiskId: `DISK-${serial}`, baseboardSerialNumber: `BOARD-${serial}`, displayId: randomBytes(128).toString('base64'), graphicCard: 'Contract graphics device' };
  const key = () => randomBytes(80).toString('base64');
  const deviceIds = new Set();
  const create = async (data = info, publicKey = key()) => {
    const result = (await kernel('/hardware/create', { info: data, publicKey }, { expected: 200 })).body;
    deviceIds.add(result.id);
    return result;
  };
  const rows = async () => {
    const result = await root.get(`/admin/hardware/users/${uuid}`);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body.data;
  };
  return { root, player, second, uuid, secondUuid, token, kernel, authorize, info, key, create, rows, deviceIds,
    async cleanup() {
      await root.del(`/admin/api/${token.body.secret}`);
      for (const id of deviceIds) {
        await query('DELETE FROM unicore_hardware_sessions WHERE device_id=?', [id]);
        await query('DELETE FROM unicore_hardware_devices WHERE id=?', [id]);
      }
    },
  };
}
