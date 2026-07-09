import { Injectable } from '@nestjs/common';
import { DeliveryMode, IssuanceKind } from 'unicore-common';
import { ConfigField } from 'src/admin/config/config.enum';
import { ConfigService } from 'src/admin/config/config.service';
import { GiveMethod } from 'src/game/store/enums/give-method.enum';
import { RconQueueService } from './rcon-queue.service';
import { RenderContext, TemplateService } from './template.service';

export interface IssuanceUser {
  username?: string;
  uuid?: string;
  real?: number;
  virtual?: number;
  email?: string;
}

export interface IssuanceServer {
  id: string;
  name?: string;
  version?: string;
  delivery_mode?: DeliveryMode;
}

export interface IssuanceProduct {
  id?: number;
  name?: string;
  item_id?: string;
  nbt?: string;
  price?: number;
  give_method?: GiveMethod;
  commands?: string[] | null;
}

export interface IssuanceGroup {
  ingame_id?: string;
  name?: string;
}

export interface IssuancePermission {
  name?: string;
  perms?: string[];
}

@Injectable()
export class IssuanceService {
  constructor(
    private readonly rconQueue: RconQueueService,
    private readonly template: TemplateService,
    private readonly configService: ConfigService,
  ) {}

  isRcon(server?: IssuanceServer): boolean {
    return server?.delivery_mode === DeliveryMode.Rcon;
  }

  async deliverProduct(user: IssuanceUser, server: IssuanceServer, product: IssuanceProduct, amount: number): Promise<boolean> {
    if (!this.isRcon(server)) return false;

    const commands = await this.buildProductCommands(user, server, product, amount);
    if (commands.length) {
      await this.rconQueue.enqueueMany(server.id, commands, {
        label: `${product.name ?? product.item_id ?? '?'} ×${amount} → ${user.username ?? ''}`,
        kind: IssuanceKind.Item,
      });
    }

    return true;
  }

  private async buildProductCommands(
    user: IssuanceUser,
    server: IssuanceServer,
    product: IssuanceProduct,
    amount: number,
  ): Promise<string[]> {
    const ctx: RenderContext = {
      user,
      server,
      product: {
        id: product.id,
        name: product.name,
        item_id: product.item_id,
        nbt: product.nbt ?? '',
        amount,
        price: product.price,
      },
      amount,
    };

    const usesCommands = product.give_method === GiveMethod.RCON || product.give_method === GiveMethod.UnicoreConnectCommand;
    if (usesCommands && product.commands?.length) {
      return product.commands.map((command) => this.template.render(command, ctx));
    }

    const template = await this.getTemplate(ConfigField.RconTplGiveItem);
    return template ? [this.template.render(template, ctx)] : [];
  }

  async deliverGroup(user: IssuanceUser, server: IssuanceServer, group: IssuanceGroup, seconds = 0): Promise<boolean> {
    if (!this.isRcon(server)) return false;

    const temp = seconds > 0 ? await this.getTemplate(ConfigField.RconTplGroupAddTemp) : '';
    const template = temp || (await this.getTemplate(ConfigField.RconTplGroupAdd));
    if (template) {
      const ctx: RenderContext = { user, server, group, period: { seconds } };
      await this.rconQueue.enqueueMany(server.id, [this.template.render(template, ctx)], {
        label: `Группа ${group.ingame_id ?? ''} → ${user.username ?? ''}`,
        kind: IssuanceKind.GroupAdd,
      });
    }

    return true;
  }

  async removeGroup(user: IssuanceUser, server: IssuanceServer, group: IssuanceGroup): Promise<boolean> {
    if (!this.isRcon(server)) return false;

    const template = await this.getTemplate(ConfigField.RconTplGroupRemove);
    if (template) {
      const ctx: RenderContext = { user, server, group };
      await this.rconQueue.enqueueMany(server.id, [this.template.render(template, ctx)], {
        label: `Снять группу ${group.ingame_id ?? ''} → ${user.username ?? ''}`,
        kind: IssuanceKind.GroupRemove,
      });
    }

    return true;
  }

  async deliverPermission(user: IssuanceUser, server: IssuanceServer, permission: IssuancePermission, seconds = 0): Promise<boolean> {
    if (!this.isRcon(server)) return false;
    if (!permission.perms?.length) return true;

    const temp = seconds > 0 ? await this.getTemplate(ConfigField.RconTplPermSetTemp) : '';
    const template = temp || (await this.getTemplate(ConfigField.RconTplPermSet));
    if (template) {
      const commands = permission.perms.map((node) =>
        this.template.render(template, { user, server, permission: { node }, period: { seconds } }),
      );
      await this.rconQueue.enqueueMany(server.id, commands, {
        label: `Право ${permission.name ?? ''} → ${user.username ?? ''}`,
        kind: IssuanceKind.PermSet,
      });
    }

    return true;
  }

  async removePermission(user: IssuanceUser, server: IssuanceServer, permission: IssuancePermission): Promise<boolean> {
    if (!this.isRcon(server)) return false;
    if (!permission.perms?.length) return true;

    const template = await this.getTemplate(ConfigField.RconTplPermUnset);
    if (template) {
      const commands = permission.perms.map((node) => this.template.render(template, { user, server, permission: { node } }));
      await this.rconQueue.enqueueMany(server.id, commands, {
        label: `Снять право ${permission.name ?? ''} → ${user.username ?? ''}`,
        kind: IssuanceKind.PermUnset,
      });
    }

    return true;
  }

  private async getTemplate(key: ConfigField): Promise<string> {
    const config = await this.configService.load();
    const value = config[key];
    return typeof value === 'string' ? value : '';
  }
}
