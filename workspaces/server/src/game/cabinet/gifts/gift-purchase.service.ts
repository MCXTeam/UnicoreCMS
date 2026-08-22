import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { customAlphabet } from 'nanoid';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from 'src/admin/users/entities/user.entity';
import { ConfigService } from 'src/admin/config/config.service';
import { EmailService } from 'src/admin/email/email.service';
import { LocalesService } from 'src/admin/locales/locales.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { configFieldNumber } from 'src/admin/config/config.utils';
import { DonateGroupsService } from 'src/game/donate/groups/providers/groups.service';
import { DonatePermissionsService } from 'src/game/donate/permissions/permissions.service';
import { PermissionType } from 'src/game/donate/permissions/enums/permission-type.enum';
import { CartService } from 'src/game/store/cart/cart.service';
import { debitUserBalance, fillPlaceholders, GIFT_CODE_ALPHABET, GIFT_CODE_LENGTH } from '@common';
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { GiftHistoryInput, HistoryService } from '../history/history.service';
import { HistoryType } from '../history/enums/history-type.enum';
import { GiftPurchaseInput } from './dto/gift-purchase.input';
import { GiftPurchaseResultDto } from './dto/gift-purchase-result.dto';
import { Gift } from './entities/gift.entity';
import { GiftType } from './enums/gift-type.enum';

const GIFTABLE = [GiftType.Donate, GiftType.Permission, GiftType.Product, GiftType.Kit];

const DAY_MS = 24 * 60 * 60 * 1000;

const generateCode = customAlphabet(GIFT_CODE_ALPHABET, GIFT_CODE_LENGTH);

type GiftConfig = Record<string, unknown>;

type GiftPayload = Omit<GiftHistoryInput, 'type' | 'ip' | 'user' | 'target'>;

@Injectable()
export class GiftPurchaseService {
  private logger = new Logger(GiftPurchaseService.name);

  constructor(
    @InjectRepository(Gift)
    private giftsRepository: Repository<Gift>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
    private groupsService: DonateGroupsService,
    private permissionsService: DonatePermissionsService,
    private cartService: CartService,
    private historyService: HistoryService,
    private emailService: EmailService,
    private localesService: LocalesService,
  ) {}

  @Transactional()
  async purchase(user: User, ip: string, input: GiftPurchaseInput): Promise<GiftPurchaseResultDto> {
    if (!GIFTABLE.includes(input.type)) throw new BadRequestException('Такое дарить нельзя');

    const cfg = await this.configService.load();
    const direct = Boolean(input.recipient);

    if (direct && !cfg[ConfigField.GiftsDirectEnabled]) throw new BadRequestException('Подарки по нику выключены');
    if (!direct && !cfg[ConfigField.GiftsCodeEnabled]) throw new BadRequestException('Подарочные коды выключены');

    await this.assertLimit(user, cfg);

    const recipient = direct ? await this.findRecipient(user, input.recipient) : null;

    switch (input.type) {
      case GiftType.Donate:
        return this.purchaseDonate(user, ip, input, recipient, cfg);
      case GiftType.Permission:
        return this.purchasePermission(user, ip, input, recipient, cfg);
      default:
        return this.purchaseStore(user, ip, input, recipient, cfg);
    }
  }

  mine(user: User): Promise<Gift[]> {
    return this.giftsRepository.find({
      where: { issued_by: { uuid: user.uuid } },
      relations: ['activations'],
      order: { created: 'DESC' },
    });
  }

  private async assertLimit(user: User, cfg: GiftConfig): Promise<void> {
    const limit = configFieldNumber(cfg, ConfigField.GiftsDailyLimit);

    if (!limit) return;

    const since = new Date(Date.now() - DAY_MS);

    if ((await this.historyService.countGifts(user, since)) >= limit)
      throw new BadRequestException('На сегодня лимит подарков исчерпан');
  }

  private async findRecipient(user: User, username: string): Promise<User> {
    const recipient = await this.usersRepository.findOneBy({ username });

    if (!recipient) throw new NotFoundException('Игрок не найден');
    if (recipient.uuid === user.uuid) throw new BadRequestException('Подарок самому себе смысла не имеет');
    if (!recipient.activated) throw new BadRequestException('Игрок ещё не подтвердил почту');

    return recipient;
  }

  private async charge(user: User, realCost: number, virtualCost: number): Promise<void> {
    await debitUserBalance(this.usersRepository, user.uuid, realCost, virtualCost);

    user.real = currencyUtils.roundByType(user.real - realCost, SystemCurrency.REAL);
    user.virtual = currencyUtils.roundByType(user.virtual - virtualCost, SystemCurrency.VIRTAUL);
  }

  private async issueCode(gift: Partial<Gift>, user: User, cfg: GiftConfig): Promise<string> {
    const days = configFieldNumber(cfg, ConfigField.GiftsCodeExpireDays);
    const created = new Gift();

    Object.assign(created, gift);

    created.promocode = generateCode();
    created.max_activations = 1;
    created.issued_by = user;

    if (days) created.expires = new Date(Date.now() + days * DAY_MS);

    await this.giftsRepository.save(created);

    return created.promocode;
  }

  private async purchaseDonate(
    user: User,
    ip: string,
    input: GiftPurchaseInput,
    recipient: User | null,
    cfg: GiftConfig,
  ): Promise<GiftPurchaseResultDto> {
    const { group, server, period, realCost, virtualCost } = await this.groupsService.quote(user, {
      group: input.donate_group,
      server: input.server,
      period: input.period,
      use_virtual: input.use_virtual,
    });

    await this.charge(user, realCost, virtualCost);

    const promocode = recipient
      ? null
      : await this.issueCode({ type: GiftType.Donate, donate_group: group, server, period }, user, cfg);

    if (recipient) await this.groupsService.give(recipient, server, group, period);

    await this.register(ip, user, recipient, {
      server,
      period,
      donateGroup: group,
      cost: { real: realCost, virtual: virtualCost },
    });

    return new GiftPurchaseResultDto({ promocode, recipient: recipient?.username });
  }

  private async purchasePermission(
    user: User,
    ip: string,
    input: GiftPurchaseInput,
    recipient: User | null,
    cfg: GiftConfig,
  ): Promise<GiftPurchaseResultDto> {
    const { permission, server, period, realCost, virtualCost } = await this.permissionsService.quote(user, {
      permission: input.donate_permission,
      server: input.server,
      period: input.period,
      use_virtual: input.use_virtual,
    });

    await this.charge(user, realCost, virtualCost);

    const promocode = recipient
      ? null
      : await this.issueCode({ type: GiftType.Permission, donate_permission: permission, server, period }, user, cfg);

    if (recipient) await this.permissionsService.give(recipient, server, permission, period);

    await this.register(ip, user, recipient, {
      server,
      period,
      donatePermission: permission,
      cost: { real: realCost, virtual: virtualCost },
    });

    return new GiftPurchaseResultDto({ promocode, recipient: recipient?.username });
  }

  private async purchaseStore(
    user: User,
    ip: string,
    input: GiftPurchaseInput,
    recipient: User | null,
    cfg: GiftConfig,
  ): Promise<GiftPurchaseResultDto> {
    const kit = input.type === GiftType.Kit;
    const {
      server,
      product,
      kit: kitEntity,
      amount,
      realCost,
      virtualCost,
    } = await this.cartService.quoteSingle(user, {
      server: input.server,
      product: kit ? undefined : input.product,
      kit: kit ? input.kit : undefined,
      amount: input.amount,
      use_virtual: input.use_virtual,
    });

    await this.charge(user, realCost, virtualCost);

    const promocode = recipient
      ? null
      : await this.issueCode(
          kit ? { type: GiftType.Kit, kit: kitEntity, server } : { type: GiftType.Product, product, server, amount },
          user,
          cfg,
        );

    if (recipient) {
      if (kit) await this.cartService.giveKit(recipient, server, kitEntity);
      else await this.cartService.giveItem(recipient, product, server, amount);
    }

    await this.register(ip, user, recipient, {
      server,
      product: kit ? undefined : product,
      kit: kit ? kitEntity : undefined,
      amount: kit ? undefined : amount,
      cost: { real: realCost, virtual: virtualCost },
    });

    return new GiftPurchaseResultDto({ promocode, recipient: recipient?.username });
  }

  private async register(ip: string, user: User, recipient: User | null, payload: GiftPayload) {
    await this.historyService.gift({ type: HistoryType.GiftPurchase, ip, user, target: recipient ?? undefined, ...payload });

    if (!recipient) return;

    await this.historyService.gift({
      type: HistoryType.GiftReceived,
      ip,
      user: recipient,
      target: user,
      ...payload,
      cost: undefined,
    });

    await this.notify(recipient, user, payload);
  }

  private async notify(recipient: User, sender: User, payload: GiftPayload) {
    try {
      const gift = await this.describe(recipient.locale, payload);

      if (gift) await this.emailService.sendGift(recipient, sender.username, gift);
    } catch (error) {
      this.logger.error(String(error));
    }
  }

  private async describe(locale: string | null, payload: GiftPayload): Promise<string> {
    const messages = await this.localesService.messages(locale || (await this.localesService.defaultCode()));
    const text = (key: string, values: Record<string, string | number>) => fillPlaceholders(messages[key] || '', values);
    const server = payload.server?.name ?? '';
    const period = payload.period?.name ?? '';

    if (payload.donateGroup) return text('cabinet.gift_donate', { name: payload.donateGroup.name, period, server });

    if (payload.donatePermission)
      return payload.donatePermission.type == PermissionType.Web
        ? text('cabinet.gift_permission_web', { name: payload.donatePermission.name, period })
        : text('cabinet.gift_permission', { name: payload.donatePermission.name, period, server });

    if (payload.kit) return text('cabinet.gift_kit', { name: payload.kit.name, server });
    if (payload.product) return text('cabinet.gift_product', { name: payload.product.name, amount: payload.amount ?? 1, server });

    return '';
  }
}
