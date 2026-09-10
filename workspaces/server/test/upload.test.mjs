import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { deflateSync } from 'node:zlib';
import { closeDatabase } from './helpers/db.mjs';
import { api } from './helpers/env.mjs';
import { cleanup, createUser } from './helpers/stand.mjs';

after(async () => {
  await cleanup();
  await closeDatabase();
});

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;

  return value >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;

  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);

  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, body) => {
  const head = Buffer.alloc(8);

  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');

  const tail = Buffer.alloc(4);

  tail.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), body])), 0);

  return Buffer.concat([head, body, tail]);
};

function pngSkin(width = 64, height = 64) {
  const header = Buffer.alloc(13);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const raw = Buffer.alloc(height * (width * 4 + 1));
  const compressed = deflateSync(raw);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('Загрузка файлов', () => {
  it('скин доезжает до обработчика и сохраняется', async () => {
    const { session } = await createUser({ perms: ['player.skin.upload'] });
    const form = new FormData();

    form.append('file', new Blob([pngSkin()], { type: 'image/png' }), 'skin.png');

    const response = await fetch(`${api}/cabinet/skin/skin`, {
      method: 'PATCH',
      body: form,
      headers: {
        Cookie: session.cookieHeader(),
        Authorization: `Bearer ${session.accessToken}`,
        'x-csrf-token': session.csrf,
        'X-Forwarded-For': session.address,
      },
    });

    const text = await response.text();

    assert.ok(
      response.status >= 200 && response.status < 300,
      `загрузка скина отвергнута: ${response.status} ${text.slice(0, 200)}`,
    );
  });
});
