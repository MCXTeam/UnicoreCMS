import { ConfigFieldSchema, modulePrefixes } from 'unicore-api';
import { moduleConfigSchema } from 'src/modules/runtime';
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
  moduleConfigSchema().flatMap((module) =>
    module.fields.map((field) => ({ key: moduleConfigKey(module.id, field), field, moduleId: module.id })),
  );

export const moduleConfigRule = (key: string): ConfigFieldSchema | null => moduleConfigFields().find((item) => item.key === key)?.field || null;
