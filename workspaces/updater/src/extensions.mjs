export function extensionProblems(records, api, satisfies) {
  const modules = new Map(
    records.filter((r) => r.kind === "modules").map((r) => [r.manifest.id, r]),
  );
  const problems = new Map();
  const add = (record) => {
    const { kind, manifest: m } = record;
    const id = `${kind}/${m.id}`;
    if (!problems.has(id))
      problems.set(id, {
        id,
        kind,
        name: m.id,
        requires: m.unicoreApi,
        dependants: [],
      });
  };
  for (const record of records) {
    if (!record.enabled) continue;
    const m = record.manifest;
    if (
      !satisfies(api, m.unicoreApi || "*") ||
      Object.entries(m.requires?.modules || {}).some(([id, range]) => {
        const dependency = modules.get(id);
        return (
          !dependency?.enabled || !satisfies(dependency.manifest.version, range)
        );
      })
    )
      add(record);
  }
  let changed;
  do {
    changed = false;
    for (const record of records) {
      if (!record.enabled) continue;
      for (const dependency of Object.keys(
        record.manifest.requires?.modules || {},
      )) {
        const problem = problems.get(`modules/${dependency}`);
        if (!problem) continue;
        if (!problem.dependants.includes(record.manifest.id))
          problem.dependants.push(record.manifest.id);
        const size = problems.size;
        add(record);
        changed ||= problems.size !== size;
      }
    }
  } while (changed);
  return [...problems.values()];
}
