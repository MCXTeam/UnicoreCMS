import { envConfig, AUDIT_CLASSES, DEFAULT_ISSUANCE_PRESET, RCON_PRESETS } from 'unicore-common';
import { AUDIT_RETENTION_DEFAULTS, GIFTS_CODE_EXPIRE_DAYS, GIFTS_DAILY_LIMIT } from '@common';
import type { ConfigFieldSchema, SettingsCategory } from 'unicore-api';
import { CONFIG_DAYS_MAX, CONFIG_NUMBER_RULES } from './config.constants';
import { AUDIT_RETENTION_FIELDS, ConfigField as F, ConfigType } from './config.enum';

export const CORE_SETTINGS_CATEGORIES = [
  { id: 'project', label: 'settings.category.project', hint: 'settings.category.project_hint', icon: 'pi pi-globe' },
  { id: 'access', label: 'settings.category.access', hint: 'settings.category.access_hint', icon: 'pi pi-shield' },
  { id: 'economy', label: 'settings.category.economy', hint: 'settings.category.economy_hint', icon: 'pi pi-wallet' },
  { id: 'gifts', label: 'settings.category.gifts', hint: 'settings.category.gifts_hint', icon: 'pi pi-gift' },
  { id: 'referrals', label: 'settings.category.referrals', hint: 'settings.category.referrals_hint', icon: 'pi pi-users' },
  { id: 'votes', label: 'settings.category.votes', hint: 'settings.category.votes_hint', icon: 'pi pi-star' },
  { id: 'launcher', label: 'settings.category.launcher', hint: 'settings.category.launcher_hint', icon: 'pi pi-desktop' },
  { id: 'issuance', label: 'settings.category.issuance', hint: 'settings.category.issuance_hint', icon: 'pi pi-server' },
  { id: 'retention', label: 'settings.category.retention', hint: 'settings.category.retention_hint', icon: 'pi pi-history' },
] as const satisfies readonly SettingsCategory[];

export function coreSettingsSchema(): ConfigFieldSchema[] {
  return coreSettingDefinitions().map((seed): ConfigFieldSchema => {
    const { key, category } = seed;
    const rule = CONFIG_NUMBER_RULES[key];
    const type = seed.type === ConfigType.boolean ? 'boolean' : seed.type === ConfigType.number ? 'number' : 'string';
    const field: ConfigFieldSchema = {
      key,
      type,
      category,
      label: `cfg.${key}_title`,
      hint: `cfg.${key}_hint`,
      default: seed.value ?? rule?.fallback ?? '',
      public: key.startsWith('public_'),
      ...(rule ? { min: rule.min, max: rule.max } : {}),
    };

    if (category === 'retention' || key === F.GiftsCodeExpireDays || key === F.GiftsDailyLimit) {
      field.integer = true;
      field.min = 0;
      field.max = category === 'retention' || key === F.GiftsCodeExpireDays ? CONFIG_DAYS_MAX : 1_000_000;
      if (key !== F.GiftsDailyLimit) field.unit = 'settings.unit.days';
    }
    if (key === F.ReferalTrigger) {
      field.integer = true;
      field.unit = 'settings.unit.minutes';
    }
    if ([F.VirtualPercent, F.ReferalPaymentPercent, F.GiftsRegiftPercent].includes(key)) field.unit = 'settings.unit.percent';
    if (key.includes('_link_') || [F.LauncherExe, F.LauncherJar].includes(key)) field.input = 'url';
    if (key === F.ProjectName) {
      field.maxLength = 120;
      field.placeholder = envConfig.sitename;
    }
    if (key === F.ProjectLogo) field.input = 'image';
    if (key.startsWith('rcon_tpl_') || key === F.LaminaraBuilds) field.input = 'textarea';
    if (key === F.RconPreset) {
      field.type = 'select';
      field.required = true;
      field.options = RCON_PRESETS.map((preset) => ({ value: preset.id, label: preset.id }));
    }
    return field;
  });
}

export interface CoreSettingDefinition {
  key: F;
  category: (typeof CORE_SETTINGS_CATEGORIES)[number]['id'];
  value?: string;
  important: boolean;
  type: ConfigType;
}

export function coreSettingDefinitions(): CoreSettingDefinition[] {
  const presetOps = (RCON_PRESETS.find((p) => p.id === DEFAULT_ISSUANCE_PRESET) ?? RCON_PRESETS[0]).ops;
  const vanillaOps = (RCON_PRESETS.find((p) => p.id === 'vanilla') ?? RCON_PRESETS[0]).ops;

  return [
    { key: F.ProjectName, category: 'project', value: '', important: true, type: ConfigType.string },
    { key: F.ProjectLogo, category: 'project', value: '', important: true, type: ConfigType.string },
    {
      key: F.EconomyRate,
      category: 'economy',
      important: true,
      type: ConfigType.number,
    },
    { key: F.LauncherExe, category: 'launcher', important: true, type: ConfigType.string },
    { key: F.LauncherJar, category: 'launcher', important: true, type: ConfigType.string },
    { key: F.LinkDiscord, category: 'project', important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
    { key: F.LinkTelegram, category: 'project', important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
    { key: F.LinkVk, category: 'project', important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
    { key: F.LinkYoutube, category: 'project', important: true, type: ConfigType.string, value: 'https://t.me/unicore_project' },
    { key: F.ReferalTrigger, category: 'referrals', important: true, type: ConfigType.number },
    { key: F.ReferalReward, category: 'referrals', important: true, type: ConfigType.number },
    { key: F.ReferalRewardPlayer, category: 'referrals', important: true, type: ConfigType.number },
    { key: F.ReferalPaymentPercent, category: 'referrals', important: true, type: ConfigType.number },
    { key: F.ReferalBindEnabled, category: 'referrals', important: true, type: ConfigType.boolean, value: 'false' },
    { key: F.ReferalRebindEnabled, category: 'referrals', important: true, type: ConfigType.boolean, value: 'false' },
    { key: F.MonitoringReward, category: 'votes', important: true, type: ConfigType.number },
    { key: F.LinkMctop, category: 'votes', important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
    { key: F.LinkMinecraftraiting, category: 'votes', important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
    { key: F.LinkTopcraft, category: 'votes', important: true, type: ConfigType.string, value: 'https://unicorecms.ru' },
    { key: F.UnbanPrice, category: 'economy', important: true, type: ConfigType.number },
    { key: F.VirtualPercent, category: 'economy', important: true, type: ConfigType.number },
    { key: F.VotesTwinkProtect, category: 'votes', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.StoreKitsVirtualUse, category: 'economy', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.StoreProductsVirtualUse, category: 'economy', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.DonateGroupsVirtualUse, category: 'economy', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.DonatePermsVirtualUse, category: 'economy', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.GiftsCodeEnabled, category: 'gifts', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.GiftsDirectEnabled, category: 'gifts', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.GiftsDailyLimit, category: 'gifts', important: true, type: ConfigType.number, value: String(GIFTS_DAILY_LIMIT) },
    {
      key: F.GiftsCodeExpireDays,
      category: 'gifts',
      important: true,
      type: ConfigType.number,
      value: String(GIFTS_CODE_EXPIRE_DAYS),
    },
    { key: F.GiftsRegiftPercent, category: 'gifts', important: true, type: ConfigType.number },
    { key: F.EmailActivationRequired, category: 'access', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.PasswordBreachCheck, category: 'access', important: true, type: ConfigType.boolean, value: 'true' },
    { key: F.OrdinaryRegister, category: 'access', important: true, type: ConfigType.boolean, value: 'false' },
    { key: F.RoleBadgeBefore, category: 'project', important: true, type: ConfigType.boolean, value: 'false' },
    {
      key: F.KeepPaidPaymentsDays,
      category: 'retention',
      important: true,
      type: ConfigType.number,
    },
    {
      key: F.KeepPendingPaymentsDays,
      category: 'retention',
      important: true,
      type: ConfigType.number,
    },
    { key: F.KeepHistoryDays, category: 'retention', important: true, type: ConfigType.number },
    ...AUDIT_CLASSES.map(
      (value): CoreSettingDefinition => ({
        key: AUDIT_RETENTION_FIELDS[value],
        category: 'retention',
        important: true,
        type: ConfigType.number,
        value: String(AUDIT_RETENTION_DEFAULTS[value]),
      }),
    ),
    { key: F.LaminaraBuilds, category: 'launcher', important: true, type: ConfigType.string, value: '' },
    { key: F.RconPreset, category: 'issuance', important: true, type: ConfigType.string, value: DEFAULT_ISSUANCE_PRESET },
    {
      key: F.RconTplGiveItem,
      category: 'issuance',
      important: true,
      type: ConfigType.string,
      value: presetOps.giveItem ?? vanillaOps.giveItem ?? '',
    },
    { key: F.RconTplGroupAdd, category: 'issuance', important: true, type: ConfigType.string, value: presetOps.groupAdd ?? '' },
    {
      key: F.RconTplGroupAddTemp,
      category: 'issuance',
      important: true,
      type: ConfigType.string,
      value: presetOps.groupAddTemp ?? '',
    },
    {
      key: F.RconTplGroupRemove,
      category: 'issuance',
      important: true,
      type: ConfigType.string,
      value: presetOps.groupRemove ?? '',
    },
    { key: F.RconTplPermSet, category: 'issuance', important: true, type: ConfigType.string, value: presetOps.permSet ?? '' },
    {
      key: F.RconTplPermSetTemp,
      category: 'issuance',
      important: true,
      type: ConfigType.string,
      value: presetOps.permSetTemp ?? '',
    },
    { key: F.RconTplPermUnset, category: 'issuance', important: true, type: ConfigType.string, value: presetOps.permUnset ?? '' },
  ];
}

export const coreConfigDefaults = () =>
  coreSettingDefinitions().map(({ category, ...setting }) => ({
    ...setting,
    value: setting.value ?? (CONFIG_NUMBER_RULES[setting.key] ? String(CONFIG_NUMBER_RULES[setting.key].fallback) : undefined),
  }));
