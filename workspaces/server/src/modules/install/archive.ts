import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import JSZip from 'jszip';
import { EXTENSION_MAX_FILES, EXTENSION_MAX_PATH_LENGTH, EXTENSION_MAX_UNPACKED_BYTES } from '@common';
import { readCentralDirectory } from './zip-directory';

const IGNORED_SEGMENTS = ['__MACOSX', '.git', '.svn'];
const IGNORED_NAMES = ['.DS_Store', 'Thumbs.db', 'desktop.ini'];
const SYMLINK_MODE = 0xa000;
const FILE_TYPE_MASK = 0xf000;

export type ExtensionKind = 'module' | 'theme';

type EntryStatus = 'ok' | 'skip' | 'unsafe';

interface ClassifiedEntry {
  entry: JSZip.JSZipObject;
  status: EntryStatus;
  parts: string[];
}

export interface ArchiveContent {
  kind: ExtensionKind;
  raw: unknown;
  zip: JSZip;
  root: string;
}

const unsafeName = (name: string): boolean => {
  const parts = name.replace(/\\/g, '/').split('/').filter(Boolean);

  return (
    name.includes('\0') ||
    name.startsWith('/') ||
    /^[a-zA-Z]:/.test(name) ||
    name.length > EXTENSION_MAX_PATH_LENGTH ||
    parts.some((part) => part === '..' || part === '.')
  );
};

const classify = (entry: JSZip.JSZipObject): ClassifiedEntry => {
  const name = entry.name;
  const parts = name.replace(/\\/g, '/').split('/').filter(Boolean);

  if (unsafeName(name)) return { entry, status: 'unsafe', parts };

  if (!parts.length) return { entry, status: 'skip', parts };

  if (parts.some((part) => IGNORED_SEGMENTS.includes(part)) || IGNORED_NAMES.includes(parts[parts.length - 1]))
    return { entry, status: 'skip', parts };

  return { entry, status: 'ok', parts };
};

const isSymlink = (entry: JSZip.JSZipObject): boolean => {
  const mode = Number((entry as { unixPermissions?: number | string | null }).unixPermissions || 0);

  return Boolean(mode) && (mode & FILE_TYPE_MASK) === SYMLINK_MODE;
};

const uncompressedSize = (entry: JSZip.JSZipObject): number => Number((entry as any)._data?.uncompressedSize || 0);

const classified = (zip: JSZip): ClassifiedEntry[] => {
  const items = Object.values(zip.files).map(classify);
  const unsafe = items.find((item) => item.status === 'unsafe');

  if (unsafe) throw new BadRequestException(`Путь «${unsafe.entry.name}» в архиве выходит за папку расширения`);

  const symlink = items.find((item) => item.status === 'ok' && isSymlink(item.entry));

  if (symlink) throw new BadRequestException(`В архиве есть символическая ссылка «${symlink.entry.name}», так устанавливать нельзя`);

  return items.filter((item) => item.status === 'ok');
};

const inside = (parts: string[], root: string): string[] | null => {
  if (!root) return parts;

  const prefix = root.split('/').filter(Boolean);

  if (parts.length <= prefix.length) return null;
  if (prefix.some((part, index) => parts[index] !== part)) return null;

  return parts.slice(prefix.length);
};

const assertRawNames = (buffer: Buffer): void => {
  const entries = readCentralDirectory(buffer);

  if (!entries) throw new BadRequestException('Оглавление архива не разбирается: пересоберите zip без zip64 и шифрования');

  for (const { name, externalAttributes } of entries) {
    if (unsafeName(name)) throw new BadRequestException(`Путь «${name}» в архиве выходит за папку расширения`);

    const mode = externalAttributes >>> 16;

    if (mode && (mode & FILE_TYPE_MASK) === SYMLINK_MODE)
      throw new BadRequestException(`В архиве есть символическая ссылка «${name}», так устанавливать нельзя`);
  }
};

export const readExtensionArchive = async (buffer: Buffer): Promise<ArchiveContent> => {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new BadRequestException('Архив не читается: нужен zip');
  }

  assertRawNames(buffer);

  const items = classified(zip);
  const files = items.filter((item) => !item.entry.dir);

  if (!files.length) throw new BadRequestException('Архив пуст');
  if (files.length > EXTENSION_MAX_FILES) throw new BadRequestException(`В архиве больше ${EXTENSION_MAX_FILES} файлов`);

  const unpacked = files.reduce((total, item) => total + uncompressedSize(item.entry), 0);

  if (unpacked > EXTENSION_MAX_UNPACKED_BYTES)
    throw new BadRequestException(`Распакованный размер больше ${Math.round(EXTENSION_MAX_UNPACKED_BYTES / 1024 / 1024)} МБ`);

  const manifests = files.filter(
    ({ parts }) => parts.length <= 2 && (parts[parts.length - 1] === 'module.json' || parts[parts.length - 1] === 'theme.json'),
  );

  if (!manifests.length) throw new BadRequestException('В архиве нет module.json или theme.json');

  const shallow = Math.min(...manifests.map(({ parts }) => parts.length));
  const candidates = manifests.filter(({ parts }) => parts.length === shallow);

  if (candidates.length > 1) throw new BadRequestException('В архиве несколько расширений, установите их по одному');

  const { entry, parts } = candidates[0];
  const name = parts[parts.length - 1];

  let raw: unknown;

  try {
    raw = JSON.parse(await entry.async('string'));
  } catch {
    throw new BadRequestException(`Файл ${name} не разбирается как JSON`);
  }

  return { kind: name === 'module.json' ? 'module' : 'theme', raw, zip, root: parts.slice(0, -1).join('/') };
};

export const extractArchive = async (content: ArchiveContent, target: string): Promise<number> => {
  let written = 0;
  let total = 0;

  mkdirSync(target, { recursive: true });

  for (const item of classified(content.zip)) {
    const parts = inside(item.parts, content.root);

    if (!parts) continue;

    const destination = join(target, ...parts);

    if (item.entry.dir) {
      mkdirSync(destination, { recursive: true });
      continue;
    }

    const data = await item.entry.async('nodebuffer');

    total += data.length;

    if (total > EXTENSION_MAX_UNPACKED_BYTES)
      throw new BadRequestException(`Распакованный размер больше ${Math.round(EXTENSION_MAX_UNPACKED_BYTES / 1024 / 1024)} МБ`);

    if (!existsSync(dirname(destination))) mkdirSync(dirname(destination), { recursive: true });

    writeFileSync(destination, data, { mode: 0o644 });
    written++;
  }

  return written;
};
