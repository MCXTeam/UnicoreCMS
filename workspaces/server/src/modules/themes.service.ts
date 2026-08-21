import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { satisfies } from 'semver';
import { API_VERSION } from 'unicore-api';
import { ThemeDto, ThemeStatus } from './dto/theme.dto';
import { activeThemeId, discoverThemes, readThemesState, themeLockedByEnv, writeThemesState } from './runtime/themes';

@Injectable()
export class ThemesService {
  find(): { themes: ThemeDto[]; active: string | null; locked: boolean } {
    const { themes, broken } = discoverThemes();
    const active = activeThemeId();

    const list = themes.map((theme) => {
      const compatible = satisfies(API_VERSION, theme.manifest.unicoreApi);

      let status: ThemeStatus = 'available';

      if (!compatible) status = 'incompatible';
      else if (theme.id === active) status = 'active';

      return new ThemeDto({
        id: theme.id,
        name: theme.manifest.name,
        version: theme.manifest.version,
        unicoreApi: theme.manifest.unicoreApi,
        side: theme.manifest.side || 'client',
        author: theme.manifest.author,
        homepage: theme.manifest.homepage,
        status,
        reason: compatible ? undefined : `требует API ${theme.manifest.unicoreApi}, установлен ${API_VERSION}`,
        replaces: Object.keys(theme.manifest.pages?.replace || {}),
        removes: theme.manifest.pages?.remove || [],
      });
    });

    for (const item of broken)
      list.push(
        new ThemeDto({
          id: item.id,
          name: item.id,
          version: '—',
          unicoreApi: '—',
          side: 'client',
          status: 'broken',
          reason: item.reason,
          replaces: [],
          removes: [],
        }),
      );

    return { themes: list, active, locked: themeLockedByEnv() };
  }

  setActive(id?: string | null): { active: string | null } {
    if (themeLockedByEnv()) throw new BadRequestException('Тема задана переменной UNICORE_THEME');

    if (id) {
      const theme = discoverThemes().themes.find((item) => item.id === id);

      if (!theme) throw new NotFoundException();

      if (!satisfies(API_VERSION, theme.manifest.unicoreApi))
        throw new BadRequestException(`Тема требует API ${theme.manifest.unicoreApi}, установлен ${API_VERSION}`);
    }

    writeThemesState({ ...readThemesState(), active: id || null });

    return { active: id || null };
  }
}
