import { GroupKit } from './entities/group-kit.entity';
import { GroupKitServer } from './entities/group-kit-server.entity';

const withPriority = (row: GroupKitServer) => Object.assign(row, { priority: row.server?.priority ?? 0 });

const byServerPriority = (left: GroupKitServer, right: GroupKitServer) =>
  (left.server?.priority ?? 0) - (right.server?.priority ?? 0) || left.kitId - right.kitId;

export function kitsForServer(kits: GroupKit[], serverId: string): GroupKit[] {
  return kits
    .map((kit) => {
      const own = kit.servers?.find((row) => row.server.id == serverId);

      return Object.assign(kit, {
        priority: kit.priority ? kit.priority : 0,
        servers: own ? [own] : [],
        images: own?.image ? [withPriority(own)] : [],
      });
    })
    .sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0) || left.id - right.id);
}

export function kitsWithAllImages(kits: GroupKit[]): GroupKit[] {
  return kits.map((kit) =>
    Object.assign(kit, {
      images: (kit.servers || [])
        .filter((row) => row.image)
        .map(withPriority)
        .sort(byServerPriority),
    }),
  );
}
