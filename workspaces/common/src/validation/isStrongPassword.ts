import {
  PASSWORD_CONTEXT_MIN_LENGTH,
  PASSWORD_EDGE_NOISE_PATTERN,
  PASSWORD_EMAIL_SEPARATOR,
  PASSWORD_ISSUE_PREFIX,
  PASSWORD_ISSUES,
  PASSWORD_LEET_MAP,
  PASSWORD_LOCALE_PREFIX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NESTED_MIN_LENGTH,
  PASSWORD_NON_LETTER_PATTERN,
} from "../constants";
import {
  PASSWORD_BLOCKLIST,
  PASSWORD_KEYBOARD_RUNS,
} from "./password-blocklist";

export {
  IS_STRONG_PASSWORD,
  PASSWORD_LOCALE_PREFIX,
  PASSWORD_ISSUE_PREFIX,
  PASSWORD_ISSUES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../constants";

export type PasswordIssue = (typeof PASSWORD_ISSUES)[number];

export interface PasswordContext {
  username?: string;
  email?: string;
  sitename?: string;
}

const blocked = new Set(PASSWORD_BLOCKLIST);

const nested = PASSWORD_BLOCKLIST.filter(
  (entry) => entry.length >= PASSWORD_NESTED_MIN_LENGTH && !/[^a-zа-яё]/.test(entry),
);

const runs = PASSWORD_KEYBOARD_RUNS.flatMap((run) => [
  run,
  run.split("").reverse().join(""),
]);

function leet(value: string): string {
  return value
    .split("")
    .map((char) => PASSWORD_LEET_MAP[char] ?? char)
    .join("");
}

function trimEdges(value: string): string {
  return value.replace(PASSWORD_EDGE_NOISE_PATTERN, "");
}

function isPeriodic(value: string): boolean {
  for (let size = 1; size <= Math.floor(value.length / 2); size++) {
    if (value.length % size) continue;

    let periodic = true;

    for (let index = size; index < value.length; index++)
      if (value[index] !== value[index % size]) {
        periodic = false;
        break;
      }

    if (periodic) return true;
  }

  return false;
}

function isRun(value: string): boolean {
  const step = value.charCodeAt(1) - value.charCodeAt(0);

  if (step !== 1 && step !== -1) return false;

  for (let index = 2; index < value.length; index++)
    if (value.charCodeAt(index) - value.charCodeAt(index - 1) !== step)
      return false;

  return true;
}

function contextTokens(context: PasswordContext): string[] {
  const [local] = String(context.email ?? "").split(PASSWORD_EMAIL_SEPARATOR);

  return [context.username, local, context.sitename]
    .map((token) => trimEdges(String(token ?? "").toLowerCase()))
    .filter((token) => token.length >= PASSWORD_CONTEXT_MIN_LENGTH);
}

export function passwordIssue(
  password: unknown,
  context: PasswordContext = {},
): PasswordIssue | null {
  if (typeof password !== "string") return "short";
  if (password.length < PASSWORD_MIN_LENGTH) return "short";
  if (password.length > PASSWORD_MAX_LENGTH) return "long";

  const plain = password.toLowerCase();
  const trimmed = trimEdges(plain);
  const relaxed = leet(plain);
  const variants = [plain, trimmed, relaxed, leet(trimmed), trimEdges(relaxed)];
  const letters = [
    plain.replace(PASSWORD_NON_LETTER_PATTERN, ""),
    relaxed.replace(PASSWORD_NON_LETTER_PATTERN, ""),
  ];

  if (
    contextTokens(context).some(
      (token) => plain.includes(token) || relaxed.includes(token),
    )
  )
    return "context";

  if (variants.some((variant) => variant.length > 0 && blocked.has(variant)))
    return "common";

  if (
    letters.some((value) => nested.some((entry) => value.includes(entry)))
  )
    return "common";

  if (isPeriodic(plain)) return "repeat";
  if (isRun(plain) || runs.some((run) => run.includes(plain))) return "sequence";

  return null;
}

export function isStrongPassword(
  password: unknown,
  context: PasswordContext = {},
): boolean {
  return passwordIssue(password, context) === null;
}

export function passwordContextOf(
  values: unknown,
  sitename?: unknown,
): PasswordContext {
  const form = (values ?? {}) as Record<string, unknown>;
  const text = (value: unknown): string | undefined =>
    typeof value === "string" ? value : undefined;

  return {
    username: text(form.username),
    email: text(form.email),
    sitename: text(sitename),
  };
}

export function passwordIssueCode(issue: PasswordIssue): string {
  return `${PASSWORD_ISSUE_PREFIX}${issue}`;
}

export function passwordIssueKey(issue: PasswordIssue): string {
  return `${PASSWORD_LOCALE_PREFIX}${passwordIssueCode(issue)}`;
}

export function passwordIssueFrom(payload: unknown): PasswordIssue | null {
  const source = payload as Record<string, any> | null;
  const message = source?.response?.data?.message ?? source?.message ?? source;
  const codes = Array.isArray(message) ? message : [message];

  for (const code of codes) {
    const issue = passwordIssueOf(code);

    if (issue) return issue;
  }

  return null;
}

export function passwordIssueOf(code: unknown): PasswordIssue | null {
  const value = String(code ?? "");

  if (!value.startsWith(PASSWORD_ISSUE_PREFIX)) return null;

  const issue = value.slice(PASSWORD_ISSUE_PREFIX.length) as PasswordIssue;

  return PASSWORD_ISSUES.includes(issue) ? issue : null;
}
