export function kernelServerRoom(serverId: string | number): string {
  return `kernel:server:${serverId}`;
}
