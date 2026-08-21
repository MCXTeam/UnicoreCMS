import { uniq } from 'lodash';
import { permissionUniverse } from '../permission-universe';

export const permissionAutocomplete = (): string[] =>
  uniq(
    permissionUniverse()
      .map((perm) => {
        const parts = perm.split('.');
        const wildcards = parts.slice(0, -1).map((_part, index) => parts.slice(0, index + 1).join('.') + '.*');

        return [...wildcards, perm];
      })
      .flat(),
  ).sort();
