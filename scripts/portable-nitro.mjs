import ts from "typescript";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function portableImports(code, file, root) {
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits = [];
  const replace = (literal) => {
    if (!literal || !ts.isStringLiteralLike(literal)) return;
    const id = literal.text;
    if (!id.startsWith("file:") && !isAbsolute(id)) return;
    const path = id.startsWith("file:") ? fileURLToPath(id) : id;
    const local = relative(resolve(root), path);
    if (local.startsWith("..") || isAbsolute(local)) throw new Error("External dependency is outside the installation: " + id);
    let target = relative(dirname(file), path).replaceAll("\\", "/");
    if (!target.startsWith(".")) target = "./" + target;
    edits.push({ start: literal.getStart(source), end: literal.end, text: JSON.stringify(target) });
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) replace(node.moduleSpecifier);
    else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) replace(node.arguments[0]);
    ts.forEachChild(node, visit);
  };
  visit(source);
  for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
  return code;
}
export async function portableNitro(output, root) {
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") await walk(file);
      else if (entry.isFile() && /\.[cm]?js$/.test(entry.name)) {
        const before = await readFile(file, "utf8");
        const after = portableImports(before, file, root);
        if (before !== after) await writeFile(file, after);
      }
    }
  };
  await walk(output);
}
