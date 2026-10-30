const { Coordinator } = require('./coordinator.cjs')
const coordinator = new Coordinator({ root: process.argv[2] })
coordinator.listen().catch(() => process.exit(1))
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => coordinator.close().finally(() => process.exit()))
