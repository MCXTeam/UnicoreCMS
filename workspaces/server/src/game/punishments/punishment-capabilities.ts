import type { ConnectInstance } from '../connect/entities/connect-instance.entity';
import type { PunishmentGroup } from './entities/punishment-group.entity';
import type { PunishmentProviderState } from './entities/punishment.entity';
import { ALL_KINDS } from './punishment.model';

export function supportsOperation(provider: PunishmentProviderState | undefined | null, kind: string, issue: boolean, expiresAtMs: number | null = null) {
  const capabilities = provider?.capabilities;
  if (provider?.mode !== 'bidirectional' || !capabilities?.exactRevoke || !capabilities.subjects.includes('PLAYER') || !capabilities.revokeKinds.includes(kind)) return false;
  if (!issue) return true;
  return capabilities.issueKinds.includes(kind) && (expiresAtMs == null ? capabilities.permanentKinds || capabilities.issueKinds : capabilities.timedKinds || capabilities.issueKinds).includes(kind);
}

export function scopeCapabilities(area: { type: string; id: string | null }, providers: PunishmentProviderState[], instances: ConnectInstance[], groups: PunishmentGroup[]) {
  const live = instances.filter((instance) => !instance.retired);
  const supports = (kind: string, expiresAtMs: number | null) => {
    let targets: PunishmentProviderState[][];
    if (area.type === 'INSTANCE') targets = live.some((instance) => instance.id === area.id) ? [providers.filter((provider) => provider.streamId === area.id)] : [];
    else if (area.type === 'GROUP') {
      const group = groups.find((group) => group.id === area.id);
      if (!group?.kinds.includes(kind)) return false;
      targets = group.members.map((member) => live.some((instance) => instance.id === member.streamId) ? providers.filter((provider) => provider.streamId === member.streamId && provider.providerId === member.providerId) : []);
    } else targets = live.filter((instance) => area.type === 'PROJECT' || instance.serverId === area.id).map((instance) => {
      const candidates = providers.filter((provider) => provider.streamId === instance.id && provider.capabilities.kinds.includes(kind));
      return candidates.length === 1 ? candidates : [];
    });
    return targets.length > 0 && targets.every((candidates) => candidates.some((provider) => supportsOperation(provider, kind, true, expiresAtMs)));
  };
  const permanentKinds = ALL_KINDS.filter((kind) => supports(kind, null));
  const timedKinds = ALL_KINDS.filter((kind) => supports(kind, Date.now() + 60_000));
  return { issueKinds: [...new Set([...permanentKinds, ...timedKinds])], timedKinds, permanentKinds };
}
