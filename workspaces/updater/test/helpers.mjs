import { parts } from "../src/releases.mjs";

export function metadata(version = "1.3.0", lock = "same") {
  return {
    version,
    commit: "a".repeat(40),
    database: { rollback: "restore" },
    components: Object.fromEntries(
      parts.map((p) => [
        p,
        {
          version,
          dependencySet: lock,
          provides: p === "server" ? { http: "1" } : {},
          requires: ["client", "admin"].includes(p) ? { http: ["1"] } : {},
        },
      ]),
    ),
  };
}
