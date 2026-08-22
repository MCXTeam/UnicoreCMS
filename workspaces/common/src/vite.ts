import {
  CHUNK_SIZE_WARNING_LIMIT,
  LEGACY_FONT_EXTENSIONS,
  VENDOR_CHUNKS,
} from "./constants";

export { CHUNK_SIZE_WARNING_LIMIT };

interface CssPlugin {
  name: string;
  enforce: "pre";
  transform(code: string, id: string): { code: string; map: null } | null;
}

const FONT_FACE = /@font-face\s*\{[^}]*\}/gi;
const SOURCE = /src\s*:\s*([^;}]+)([;}]?)/gi;
const DATA_URL = /url\(\s*['"]?data:/i;

function legacy(source: string): boolean {
  const url = source.match(/url\(\s*['"]?([^'")]+)/i);

  if (!url) return false;

  const path = url[1].split(/[?#]/)[0].toLowerCase();

  return LEGACY_FONT_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function trim(face: string): string {
  if (DATA_URL.test(face)) return face;

  let modern = false;

  const next = face.replace(
    SOURCE,
    (all, list: string, tail: string) => {
      const survivors = list
        .split(/,(?![^()]*\))/)
        .map((source) => source.trim())
        .filter(Boolean)
        .filter((source) => !legacy(source));

      if (survivors.some((source) => !source.startsWith("local(")))
        modern = true;

      if (!survivors.length) return tail === "}" ? tail : "";

      return `src: ${survivors.join(", ")}${tail}`;
    },
  );

  return modern ? next : face;
}

export function woff2Only(): CssPlugin {
  return {
    name: "unicore-woff2-only",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith(".css") || !code.includes("@font-face"))
        return null;

      const next = code.replace(FONT_FACE, trim);

      return next === code ? null : { code: next, map: null };
    },
  };
}

export function vendorChunks(): (id: string) => string | undefined {
  return (id) => {
    if (!id.includes("node_modules")) return undefined;

    for (const [chunk, pattern] of VENDOR_CHUNKS)
      if (pattern.test(id)) return chunk;

    return undefined;
  };
}
