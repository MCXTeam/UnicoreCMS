const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_MIN_SIZE = 22;
const EOCD_MAX_COMMENT = 0xffff;
const ZIP64_MARKER_16 = 0xffff;
const ZIP64_MARKER_32 = 0xffffffff;
const UTF8_FLAG = 0x800;

export interface ZipDirectoryEntry {
  name: string;
  externalAttributes: number;
}

const findEocd = (buffer: Buffer): number => {
  const from = Math.max(0, buffer.length - EOCD_MIN_SIZE - EOCD_MAX_COMMENT);

  for (let offset = buffer.length - EOCD_MIN_SIZE; offset >= from; offset--)
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) return offset;

  return -1;
};

export const readCentralDirectory = (buffer: Buffer): ZipDirectoryEntry[] | null => {
  const eocd = findEocd(buffer);

  if (eocd < 0) return null;

  const total = buffer.readUInt16LE(eocd + 10);
  const size = buffer.readUInt32LE(eocd + 12);
  const start = buffer.readUInt32LE(eocd + 16);

  if (total === ZIP64_MARKER_16 || size === ZIP64_MARKER_32 || start === ZIP64_MARKER_32) return null;
  if (start + size > buffer.length) return null;

  const entries: ZipDirectoryEntry[] = [];
  let offset = start;

  for (let index = 0; index < total; index++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_SIGNATURE) return null;

    const flags = buffer.readUInt16LE(offset + 8);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nameStart = offset + 46;

    if (nameStart + nameLength > buffer.length) return null;

    entries.push({
      name: buffer.toString(flags & UTF8_FLAG ? 'utf-8' : 'latin1', nameStart, nameStart + nameLength),
      externalAttributes,
    });

    offset = nameStart + nameLength + extraLength + commentLength;
  }

  return entries;
};
