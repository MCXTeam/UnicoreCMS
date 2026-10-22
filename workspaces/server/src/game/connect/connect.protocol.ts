export type ActivityState = 'ACTIVE' | 'AFK' | 'UNKNOWN';
export type VisibilityState = 'VISIBLE' | 'HIDDEN' | 'UNKNOWN';

export interface PlayerObservation {
  uuid: string;
  name: string;
  activity: ActivityState;
  visibility: VisibilityState;
}

export interface SessionCheckpoint {
  sessionId: string;
  userUuid: string;
  sequence: number;
  connectedMs: number;
  activeMs: number;
  closed: boolean;
}

export interface PresenceSnapshot {
  sequence: number;
  observedAtMs: number;
  maxPlayers: number;
  players: PlayerObservation[];
}

export interface PresenceView {
  online: boolean | null;
  players: number | null;
  maxplayers: number;
  source: 'connect';
  freshness: 'fresh' | 'stale';
  lastSeenAt: Date;
  playerList: { uuid: string; name: string; afk: boolean }[];
}

export const CONNECT_STALE_MS = 45_000;
export const CONNECT_MAX_BATCH = 1000;

export function checkpointDelta(
  previous: Pick<SessionCheckpoint, 'sequence' | 'connectedMs' | 'activeMs' | 'closed'> | null,
  next: SessionCheckpoint,
) {
  if (
    !Number.isSafeInteger(next.sequence) ||
    next.sequence < 1 ||
    !Number.isSafeInteger(next.connectedMs) ||
    !Number.isSafeInteger(next.activeMs) ||
    next.activeMs < 0 ||
    next.connectedMs < next.activeMs
  ) {
    throw new Error('Invalid session counters');
  }
  if (previous && next.sequence <= previous.sequence) return { connectedMs: 0, activeMs: 0, accepted: false };
  if (previous && (previous.closed || next.connectedMs < previous.connectedMs || next.activeMs < previous.activeMs))
    throw new Error('Session counters cannot regress or reopen');
  const connectedMs = next.connectedMs - (previous?.connectedMs || 0);
  const activeMs = next.activeMs - (previous?.activeMs || 0);
  if (activeMs > connectedMs + 1) throw new Error('Active interval exceeds connected interval');
  return { connectedMs, activeMs, accepted: true };
}

export function publicPresence(snapshot: PresenceSnapshot, lastSeenAt: Date, nowMs: number = Date.now()): PresenceView {
  const fresh = nowMs - lastSeenAt.getTime() <= CONNECT_STALE_MS;
  const unknownVisibility = snapshot.players.some((player) => player.visibility === 'UNKNOWN');
  const playerList = fresh
    ? snapshot.players
        .filter((player) => player.visibility === 'VISIBLE')
        .map((player) => ({ uuid: player.uuid, name: player.name, afk: player.activity === 'AFK' }))
    : [];
  return {
    online: fresh ? true : null,
    players: fresh && !unknownVisibility ? playerList.length : null,
    maxplayers: snapshot.maxPlayers,
    source: 'connect',
    freshness: fresh ? 'fresh' : 'stale',
    lastSeenAt,
    playerList,
  };
}

export function mergePresence(
  samples: { snapshot: PresenceSnapshot; lastSeenAt: Date }[],
  nowMs = Date.now(),
  concealed = new Set<string>(),
): PresenceView {
  const observations = new Map<string, PlayerObservation>();
  for (const sample of samples)
    for (const player of sample.snapshot.players) {
      if (player.visibility !== 'VISIBLE') concealed.add(player.uuid);
    }
  const fresh = samples.every((sample) => nowMs - sample.lastSeenAt.getTime() <= CONNECT_STALE_MS);
  const known = samples.every((sample) => !sample.snapshot.players.some((player) => player.visibility === 'UNKNOWN'));
  for (const sample of samples) {
    if (nowMs - sample.lastSeenAt.getTime() > CONNECT_STALE_MS) continue;
    for (const player of sample.snapshot.players) if (!concealed.has(player.uuid)) observations.set(player.uuid, player);
  }
  const playerList = [...observations.values()].map((player) => ({ uuid: player.uuid, name: player.name, afk: player.activity === 'AFK' }));
  return {
    online: samples.some((sample) => nowMs - sample.lastSeenAt.getTime() <= CONNECT_STALE_MS) ? true : null,
    players: fresh && known ? playerList.length : null,
    maxplayers: samples.reduce((sum, sample) => sum + sample.snapshot.maxPlayers, 0),
    source: 'connect',
    freshness: fresh && known ? 'fresh' : 'stale',
    lastSeenAt: new Date(Math.min(...samples.map((sample) => sample.lastSeenAt.getTime()))),
    playerList,
  };
}
