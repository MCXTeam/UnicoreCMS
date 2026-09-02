import { PNG_HEADER_LENGTH, PNG_IHDR_OFFSET, PNG_IHDR_TYPE, PNG_SIGNATURE, PNG_SIZE_OFFSET } from '../constants';

export interface PngSize {
  width: number;
  height: number;
}

export function pngSize(buffer: Buffer): PngSize | null {
  if (!buffer || buffer.length < PNG_HEADER_LENGTH) return null;
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return null;
  if (buffer.toString('ascii', PNG_IHDR_OFFSET, PNG_IHDR_OFFSET + PNG_IHDR_TYPE.length) !== PNG_IHDR_TYPE) return null;

  const width = buffer.readUInt32BE(PNG_SIZE_OFFSET);
  const height = buffer.readUInt32BE(PNG_SIZE_OFFSET + 4);

  if (!width || !height) return null;

  return { width, height };
}
