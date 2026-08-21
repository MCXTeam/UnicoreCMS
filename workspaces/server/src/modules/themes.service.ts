import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { satisfies } from 'semver';
import { API_VERSION } from 'unicore-api';
import { ThemeDto, ThemeStatus } from './dto/theme.dto';
import { activeThemeId, discoverThemes, readThemesState, ThemeSide, themeLockedByEnv, writeThemesState } from './runtime/themes';

const SIDES: ThemeSide[] = ['client', 'admin'];

export interface ThemesView {
  themes: ThemeDto[];
  active: Record<ThemeSide, string | null>;
  locked: Record<ThemeSide, boolean>;
}

@Injectable()
export class ThemesService {
  find(): ThemesView {
    const { themes, broken } = discoverThemes();
    const active = this.activeBySide();

    const list = themes.map((theme) => {
      const side = (theme.manifest.side || 'client') as ThemeSide;
      const compatible = satisfies(API_VERSION, theme.manifest.unicoreApi);

      let status: ThemeStatus = 'available';

      if (!compatible) status = 'incompatible';
      else if (theme.id === active[side]) status = 'active';

      return new ThemeDto({
        id: theme.id,
        name: theme.manifest.name,
        version: theme.manifest.version,
        unicoreApi: theme.manifest.unicoreApi,
        side,
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

    return { themes: list, active, locked: { client: themeLockedByEnv('client'), admin: themeLockedByEnv('admin') } };
  }

  setActive(id?: string | null, requestedSide?: ThemeSide): { active: Record<ThemeSide, string | null> } {
    const side = id ? this.sideOf(id) : requestedSide;

    if (!side) throw new BadRequestException('Не указано, для какой стороны менять тему');

    if (themeLockedByEnv(side))
      throw new BadRequestException(`Тема задана переменной ${side === 'admin' ? 'UNICORE_ADMIN_THEME' : 'UNICORE_THEME'}`);

    writeThemesState({ ...readThemesState(), [side]: id || null });

    return { active: this.activeBySide() };
  }

  private activeBySide(): Record<ThemeSide, string | null> {
    return { client: activeThemeId('client'), admin: activeThemeId('admin') };
  }

  private sideOf(id: string): ThemeSide {
    const theme = discoverThemes().themes.find((item) => item.id === id);

    if (!theme) throw new NotFoundException();

    if (!satisfies(API_VERSION, theme.manifest.unicoreApi))
      throw new BadRequestException(`Тема требует API ${theme.manifest.unicoreApi}, установлен ${API_VERSION}`);

    return (theme.manifest.side || 'client') as ThemeSide;
  }
}
