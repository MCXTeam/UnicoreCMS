const fs = require('fs');

const CGROUP_LIMIT_FILES = ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory/memory.limit_in_bytes'];
const CGROUP_LIMIT_MAX = 64 * 1024 * 1024 * 1024;
const HEAP_SHARE = 0.75;
const HEAP_MIN_MB = 512;

function heapOptions() {
  for (const file of CGROUP_LIMIT_FILES) {
    let limit;

    try {
      limit = Number(fs.readFileSync(file, 'utf8').trim());
    } catch {
      continue;
    }

    if (!Number.isFinite(limit) || limit <= 0 || limit > CGROUP_LIMIT_MAX) continue;

    const megabytes = Math.floor((limit / 1024 / 1024) * HEAP_SHARE);

    if (megabytes >= HEAP_MIN_MB) return [`--max-old-space-size=${megabytes}`];
  }

  return [];
}

module.exports = { heapOptions };
