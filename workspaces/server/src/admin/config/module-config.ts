import { ConfigFieldSchema, modulePrefixes } from 'unicore-api';
import { discover, moduleConfigSchema } from 'src/modules/runtime';
import { ConfigType } from './config.enum';

export const configTypeOf = (type: ConfigFieldSchema['type']): ConfigType => {
  if (type === 'number') return ConfigType.number;
  if (type === 'boolean') return ConfigType.boolean;

  return ConfigType.string;
};

export const moduleConfigKey = (moduleId: string, field: ConfigFieldSchema): string => {
  const prefixes = modulePrefixes(moduleId);

  return `${field.public ? prefixes.publicConfig : prefixes.config}${field.key}`;
};

export const moduleConfigFields = (): { key: string; field: ConfigFieldSchema; moduleId: string }[] =>
  moduleSettingsSchemas().flatMap((module) =>
    module.fields.map((field) => ({ key: moduleConfigKey(module.id, field), field, moduleId: module.id })),
  );

export function moduleSettingsSchemas() {
  const runtime = moduleConfigSchema();

  return discover().modules.map((module) => ({
    id: module.id,
    name: module.manifest.name || module.id,
    fields: runtime.find((entry) => entry.id === module.id)?.fields ?? module.manifest.config ?? [],
  }));
}

export const moduleConfigRule = (key: string): ConfigFieldSchema | null => moduleConfigFields().find((item) => item.key === key)?.field || null;

export const inactiveModuleConfigPrefixes = (): string[] =>
  discover()
    .modules.filter((module) => !module.enabled)
    .flatMap((module) => {
      const prefixes = modulePrefixes(module.id);

      return [prefixes.config, prefixes.publicConfig];
    });
