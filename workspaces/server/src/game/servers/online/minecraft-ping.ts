import * as net from 'net';

export interface MinecraftStatus {
  online: number;
  max: number;
  version?: string;
}

function writeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  let v = value >>> 0;

  do {
    let temp = v & 0x7f;
    v >>>= 7;
    if (v !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (v !== 0);

  return Buffer.from(bytes);
}

function readVarInt(buffer: Buffer, offset: number): { value: number; size: number } | null {
  let value = 0;
  let size = 0;
  let byte: number;

  do {
    if (offset + size >= buffer.length) return null;
    byte = buffer[offset + size];
    value |= (byte & 0x7f) << (7 * size);
    size++;
    if (size > 5) throw new Error('VarInt too big');
  } while (byte & 0x80);

  return { value: value >>> 0, size };
}

function packet(id: number, data: Buffer): Buffer {
  const body = Buffer.concat([writeVarInt(id), data]);
  return Buffer.concat([writeVarInt(body.length), body]);
}

export function pingMinecraft(host: string, port = 25565, timeout = 3000): Promise<MinecraftStatus> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    let buffer = Buffer.alloc(0);
    let done = false;

    const ok = (result: MinecraftStatus) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(result);
    };

    const fail = (error: Error) => {
      if (done) return;
      done = true;
      socket.destroy();
      reject(error);
    };

    socket.setTimeout(timeout);
    socket.on('timeout', () => fail(new Error('Ping timeout')));
    socket.on('error', (error) => fail(error));
    socket.on('close', () => fail(new Error('Connection closed before response')));

    socket.on('connect', () => {
      const hostBuffer = Buffer.from(host, 'utf8');
      const portBuffer = Buffer.alloc(2);
      portBuffer.writeUInt16BE(port);

      const handshake = packet(
        0x00,
        Buffer.concat([writeVarInt(-1), writeVarInt(hostBuffer.length), hostBuffer, portBuffer, writeVarInt(1)]),
      );

      socket.write(Buffer.concat([handshake, packet(0x00, Buffer.alloc(0))]));
    });

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      try {
        const lengthField = readVarInt(buffer, 0);
        if (!lengthField || buffer.length < lengthField.size + lengthField.value) return;

        let offset = lengthField.size;

        const packetId = readVarInt(buffer, offset);
        if (!packetId) return;
        offset += packetId.size;

        const jsonLength = readVarInt(buffer, offset);
        if (!jsonLength) return;
        offset += jsonLength.size;

        if (buffer.length < offset + jsonLength.value) return;

        const json = JSON.parse(buffer.subarray(offset, offset + jsonLength.value).toString('utf8'));

        ok({
          online: json.players?.online ?? 0,
          max: json.players?.max ?? 0,
          version: json.version?.name,
        });
      } catch (error) {
        fail(error as Error);
      }
    });
  });
}
