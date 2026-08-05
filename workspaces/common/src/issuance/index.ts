export enum DeliveryMode {
  Plugin = 0,
  Rcon = 1,
}

export enum RconCommandStatus {
  Pending = 0,
  Sent = 1,
  Failed = 2,
}

export enum IssuanceKind {
  Item = "item",
  GroupAdd = "group_add",
  GroupRemove = "group_remove",
  PermSet = "perm_set",
  PermUnset = "perm_unset",
}

export interface PlaceholderDef {
  token: string;
  group: string;
  description: string;
  example: string;
}

export const RCON_PLACEHOLDERS: PlaceholderDef[] = [
  {
    token: "{user.username}",
    group: "Игрок",
    description: "Ник игрока",
    example: "Notch",
  },
  {
    token: "{user.uuid}",
    group: "Игрок",
    description: "UUID игрока (без дефисов у некоторых плагинов)",
    example: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  },
  {
    token: "{user.real}",
    group: "Игрок",
    description: "Реальный баланс",
    example: "150.00",
  },
  {
    token: "{user.virtual}",
    group: "Игрок",
    description: "Бонусный баланс",
    example: "10.00",
  },
  {
    token: "{user.email}",
    group: "Игрок",
    description: "Email игрока",
    example: "user@example.com",
  },
  {
    token: "{server.id}",
    group: "Сервер",
    description: "ID (slug) сервера",
    example: "hitech",
  },
  {
    token: "{server.name}",
    group: "Сервер",
    description: "Название сервера",
    example: "HiTech",
  },
  {
    token: "{server.version}",
    group: "Сервер",
    description: "Версия сервера",
    example: "1.12.2",
  },
  {
    token: "{product.name}",
    group: "Товар",
    description: "Название товара",
    example: "Алмаз",
  },
  {
    token: "{product.id}",
    group: "Товар",
    description: "ID товара",
    example: "42",
  },
  {
    token: "{product.item_id}",
    group: "Товар",
    description: "Игровой ID предмета",
    example: "minecraft:diamond",
  },
  {
    token: "{product.nbt}",
    group: "Товар",
    description: "NBT / компоненты предмета",
    example: "{Enchantments:[{id:sharpness,lvl:5}]}",
  },
  {
    token: "{product.amount}",
    group: "Товар",
    description: "Количество",
    example: "64",
  },
  {
    token: "{product.price}",
    group: "Товар",
    description: "Цена товара",
    example: "99.00",
  },
  {
    token: "{group.ingame_id}",
    group: "Привилегия",
    description: "Игровой ID группы / ранга",
    example: "vip",
  },
  {
    token: "{permission.node}",
    group: "Привилегия",
    description: "Узел права",
    example: "essentials.fly",
  },
  {
    token: "{period.seconds}",
    group: "Период",
    description: "Длительность в секундах (0 = навсегда)",
    example: "2592000",
  },
  {
    token: "{period.duration}",
    group: "Период",
    description: "Длительность строкой с юнитами",
    example: "30d",
  },
];

export interface IssuancePresetOps {
  giveItem: string | null;
  groupAdd: string | null;
  groupAddTemp: string | null;
  groupRemove: string | null;
  permSet: string | null;
  permSetTemp: string | null;
  permUnset: string | null;
}

export interface IssuancePreset {
  id: string;
  name: string;
  platform: string;
  note: string;
  ops: IssuancePresetOps;
}

export const RCON_PRESETS: IssuancePreset[] = [
  {
    id: "luckperms",
    name: "LuckPerms",
    platform: "Bukkit/Spigot/Paper, Forge, Fabric, Sponge, Velocity",
    note: "Самый популярный плагин прав. Принимает UUID или ник. Длительность — строка с юнитами (30d, 1h30m); голое число = epoch, поэтому используем {period.duration}. Группа должна существовать (lp creategroup).",
    ops: {
      giveItem: null,
      groupAdd: "lp user {user.uuid} parent add {group.ingame_id}",
      groupAddTemp:
        "lp user {user.uuid} parent addtemp {group.ingame_id} {period.duration} accumulate",
      groupRemove: "lp user {user.uuid} parent remove {group.ingame_id}",
      permSet: "lp user {user.uuid} permission set {permission.node} true",
      permSetTemp:
        "lp user {user.uuid} permission settemp {permission.node} true {period.duration} accumulate",
      permUnset: "lp user {user.uuid} permission unset {permission.node}",
    },
  },
  {
    id: "essentials_groupmanager",
    name: "EssentialsX + GroupManager",
    platform: "Bukkit/Spigot/Paper",
    note: "Предметы — EssentialsX /give (не /i). Группы/права — GroupManager (man*). Только по нику. Временные — только у прав ({node}|{period.duration}), юниты d/h/m (без секунд).",
    ops: {
      giveItem:
        "give {user.username} {product.item_id} {product.amount} {product.nbt}",
      groupAdd: "manuaddsub {user.username} {group.ingame_id}",
      groupAddTemp: null,
      groupRemove: "manudelsub {user.username} {group.ingame_id}",
      permSet: "manuaddp {user.username} {permission.node}",
      permSetTemp:
        "manuaddp {user.username} {permission.node}|{period.duration}",
      permUnset: "manudelp {user.username} {permission.node}",
    },
  },
  {
    id: "permissionsex",
    name: "PermissionsEx (PEX)",
    platform: "Bukkit/Spigot/Paper (legacy)",
    note: "Классический плагин прав. По нику. Длительность — голые секунды ({period.seconds}).",
    ops: {
      giveItem: null,
      groupAdd: "pex user {user.username} group add {group.ingame_id}",
      groupAddTemp:
        "pex user {user.username} group add {group.ingame_id} * {period.seconds}",
      groupRemove: "pex user {user.username} group remove {group.ingame_id}",
      permSet: "pex user {user.username} add {permission.node}",
      permSetTemp:
        "pex user {user.username} timed add {permission.node} {period.seconds}",
      permUnset: "pex user {user.username} remove {permission.node}",
    },
  },
  {
    id: "ftbranks",
    name: "FTB Ranks",
    platform: "Forge / NeoForge / Fabric (моды)",
    note: "Модовые ранги. Предметы — ванильный /give. По нику. Временных рангов нет (только постоянные). Права навешиваются на РАНГ, а не на игрока.",
    ops: {
      giveItem:
        "give {user.username} {product.item_id}{product.nbt} {product.amount}",
      groupAdd: "ftbranks add {user.username} {group.ingame_id}",
      groupAddTemp: null,
      groupRemove: "ftbranks remove {user.username} {group.ingame_id}",
      permSet: "ftbranks node add {group.ingame_id} {permission.node} true",
      permSetTemp: null,
      permUnset: "ftbranks node remove {group.ingame_id} {permission.node}",
    },
  },
  {
    id: "powerranks",
    name: "PowerRanks",
    platform: "Bukkit/Spigot/Paper",
    note: "Ранг-плагин. Ник или UUID. Временные ранги — тег expires:{period.duration}.",
    ops: {
      giveItem: null,
      groupAdd: "pr addrank {user.username} {group.ingame_id}",
      groupAddTemp:
        "pr addrank {user.username} {group.ingame_id} expires:{period.duration}",
      groupRemove: "pr delrank {user.username} {group.ingame_id}",
      permSet: "pr addplayerperm {user.username} {permission.node}",
      permSetTemp: null,
      permUnset: "pr delplayerperm {user.username} {permission.node}",
    },
  },
  {
    id: "sponge_nucleus",
    name: "Sponge (Nucleus + LuckPerms)",
    platform: "SpongeForge / SpongeVanilla",
    note: "Предметы — Nucleus /give (порядок аргументов иной). Права/группы — LuckPerms-Sponge.",
    ops: {
      giveItem:
        "give {user.username} {product.item_id} {product.amount} 0 {product.nbt}",
      groupAdd: "lp user {user.username} parent add {group.ingame_id}",
      groupAddTemp:
        "lp user {user.username} parent addtemp {group.ingame_id} {period.duration} accumulate",
      groupRemove: "lp user {user.username} parent remove {group.ingame_id}",
      permSet: "lp user {user.username} permission set {permission.node} true",
      permSetTemp:
        "lp user {user.username} permission settemp {permission.node} true {period.duration} accumulate",
      permUnset: "lp user {user.username} permission unset {permission.node}",
    },
  },
  {
    id: "vanilla",
    name: "Vanilla /give",
    platform: "Любой ванильный сервер (Java)",
    note: "Только выдача предметов. 1.13+ — NBT в {}, 1.20.5+ — компоненты в []. По нику, игрок должен быть онлайн.",
    ops: {
      giveItem:
        "give {user.username} {product.item_id}{product.nbt} {product.amount}",
      groupAdd: null,
      groupAddTemp: null,
      groupRemove: null,
      permSet: null,
      permSetTemp: null,
      permUnset: null,
    },
  },
];

export { DEFAULT_ISSUANCE_PRESET } from "../constants";

export interface RenderContext {
  user?: {
    username?: string;
    uuid?: string;
    real?: number;
    virtual?: number;
    email?: string;
  };
  server?: { id?: string; name?: string; version?: string };
  product?: {
    id?: number;
    name?: string;
    item_id?: string;
    nbt?: string;
    amount?: number;
    price?: number;
  };
  group?: { ingame_id?: string };
  permission?: { node?: string };
  period?: { seconds?: number };
  amount?: number;
}

export function secondsToDuration(seconds: number): string {
  const total = Math.floor(seconds || 0);
  if (total <= 0) return "";

  const units: [number, string][] = [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
    [1, "s"],
  ];

  let remaining = total;
  let out = "";
  for (const [size, label] of units) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      remaining -= count * size;
      out += `${count}${label}`;
    }
  }

  return out || "0s";
}

export function renderTemplate(template: string, ctx: RenderContext): string {
  const seconds = ctx.period?.seconds ?? 0;
  const amount = ctx.product?.amount ?? ctx.amount;
  const num = (value?: number) => (value != null ? String(value) : "");

  const values: Record<string, string> = {
    "user.username": ctx.user?.username ?? "",
    "user.uuid": ctx.user?.uuid ?? "",
    "user.real": num(ctx.user?.real),
    "user.virtual": num(ctx.user?.virtual),
    "user.email": ctx.user?.email ?? "",
    "server.id": ctx.server?.id ?? "",
    "server.name": ctx.server?.name ?? "",
    "server.version": ctx.server?.version ?? "",
    "product.id": ctx.product?.id != null ? String(ctx.product.id) : "",
    "product.name": ctx.product?.name ?? "",
    "product.item_id": ctx.product?.item_id ?? "",
    "product.nbt": ctx.product?.nbt ?? "",
    "product.amount": amount != null ? String(amount) : "",
    "product.price": num(ctx.product?.price),
    "group.ingame_id": ctx.group?.ingame_id ?? "",
    "permission.node": ctx.permission?.node ?? "",
    "period.seconds": String(seconds),
    "period.duration": secondsToDuration(seconds),
    amount: amount != null ? String(amount) : "",
  };

  return template.replace(/\{([a-z0-9_.]+)\}/gi, (match, key) =>
    key in values ? values[key] : match,
  );
}
