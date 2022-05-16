import { MomentWrapper } from '@common';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonateGroupsService } from 'src/game/donate/groups/providers/groups.service';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { DonatePermissionsService } from 'src/game/donate/permissions/permissions.service';
import { Server } from 'src/game/servers/entities/server.entity';
import { CartService } from 'src/game/store/cart/cart.service';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { In, Repository } from 'typeorm';
import { Money } from '../money/entities/money.entity';
import { MoneyService } from '../money/money.service';
import { GiftDto } from './dto/gift.dto';
import { GiftInput } from './dto/gift.input';
import { GiftActivation } from './entities/gift-activation.entity';
import { Gift } from './entities/gift.entity';
import { GiftType } from './enums/gift-type.enum';

@Injectable()
export class GiftsService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(DonatePermission)
    private donatePermissionsRepository: Repository<DonatePermission>,
    @InjectRepository(DonateGroup)
    private donateGroupsRepository: Repository<DonateGroup>,
    @InjectRepository(Server)
    private serversRepository: Repository<Server>,
    @InjectRepository(Period)
    private periodsRepository: Repository<Period>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Kit)
    private kitsRepository: Repository<Kit>,
    @InjectRepository(Gift)
    private giftsRepository: Repository<Gift>,
    @InjectRepository(GiftActivation)
    private giftsActivationsRepository: Repository<GiftActivation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Money)
    private moneyRepository: Repository<Money>,
    private moneyService: MoneyService,
    private donateGroupsService: DonateGroupsService,
    private donatePermissionsService: DonatePermissionsService,
    private cartService: CartService
  ) { }

  find(): Promise<Gift[]> {
    const qb = this.giftsRepository.createQueryBuilder('gift').loadRelationCountAndMap('gift.activations', 'gift.activations').getMany();

    return qb;
  }

  findOne(id: number, relations?: string[]): Promise<Gift> {
    return this.giftsRepository.findOne(id, { relations });
  }

  async activate(user: User, promocode: string) {
    const gift = await this.giftsRepository.findOne({ where: { promocode }, relations: ['activations'] })

    if (!gift) {
      throw new NotFoundException();
    }

    if (gift.max_activations && gift.activations.length >= gift.max_activations) {
      throw new NotFoundException();
    }

    if (gift.expires && this.moment().toDate() >= gift.expires) {
      throw new NotFoundException();
    }

    if (await this.giftsActivationsRepository.findOne({ where: { user, gift }, relations: ['user', 'gift'] })) {
      throw new ConflictException();
    }

    switch (gift.type) {
      case GiftType.Product:
        await this.cartService.giveItem(user, gift.product, gift.server, gift.amount)
        break;
      case GiftType.Kit:
        await this.cartService.giveKit(user, gift.server, gift.kit.id)
        break;
      case GiftType.Donate:
        await this.donateGroupsService.give(user, gift.server, gift.donate_group, gift.period)
        break;
      case GiftType.Permission:
        await this.donatePermissionsService.give(user, gift.server, gift.donate_permission, gift.period)
        break;
      case GiftType.Money:
        const userMoney = await this.moneyService.findOneByUserAndServer(gift.server.id, user)
        await this.moneyRepository.save(userMoney)
        break;
      case GiftType.Real:
        await this.usersRepository.increment({ uuid: user.uuid }, "real", gift.amount)
        break;
    }

    const ga = new GiftActivation()
    ga.gift = gift
    ga.user = user
    
    await this.giftsActivationsRepository.insert(ga)

    return new GiftDto(gift)
  }

  async create(input: GiftInput) {
    if (await this.giftsRepository.findOne({ promocode: input.promocode })) {
      throw new NotFoundException();
    }

    const gift = new Gift();

    gift.promocode = input.promocode;
    gift.type = input.type;
    gift.max_activations = input.max_activations;
    gift.expires = this.moment(input.expires).utc().toDate();

    gift.product = null;
    gift.kit = null;
    gift.donate_group = null;
    gift.donate_permission = null;
    gift.server = null;
    gift.period = null;
    gift.amount = null;

    switch (input.type) {
      case GiftType.Product:
        gift.amount = input.amount;
        gift.product = await this.productsRepository.findOneOrFail(input.product);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Kit:
        gift.kit = await this.kitsRepository.findOneOrFail(input.kit);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Donate:
        gift.donate_group = await this.donateGroupsRepository.findOneOrFail(input.donate_group);
        gift.period = await this.periodsRepository.findOneOrFail(input.period);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Permission:
        gift.donate_permission = await this.donatePermissionsRepository.findOneOrFail(input.donate_permission);
        gift.period = await this.periodsRepository.findOneOrFail(input.period);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Money:
        gift.amount = input.amount;
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Real:
        gift.amount = input.amount;
        break;
    }

    return this.giftsRepository.save(gift);
  }

  async update(id: number, input: GiftInput) {
    const gift = await this.findOne(id);

    if (!gift) {
      throw new NotFoundException();
    }

    gift.promocode = input.promocode;
    gift.type = input.type;
    gift.max_activations = input.max_activations;
    gift.expires = this.moment(input.expires).utc().toDate();

    gift.product = null;
    gift.kit = null;
    gift.donate_group = null;
    gift.donate_permission = null;
    gift.server = null;
    gift.period = null;
    gift.amount = null;

    switch (input.type) {
      case GiftType.Product:
        gift.amount = input.amount;
        gift.product = await this.productsRepository.findOneOrFail(input.product);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Kit:
        gift.kit = await this.kitsRepository.findOneOrFail(input.kit);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Donate:
        gift.donate_group = await this.donateGroupsRepository.findOneOrFail(input.donate_group);
        gift.period = await this.periodsRepository.findOneOrFail(input.period);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Permission:
        gift.donate_permission = await this.donatePermissionsRepository.findOneOrFail(input.donate_permission);
        gift.period = await this.periodsRepository.findOneOrFail(input.period);
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Money:
        gift.amount = input.amount;
        gift.server = await this.serversRepository.findOneOrFail(input.server);
        break;
      case GiftType.Real:
        gift.amount = input.amount;
        break;
    }

    return this.giftsRepository.save(gift);
  }

  async remove(id: number) {
    const gift = await this.findOne(id);

    if (!gift) {
      throw new NotFoundException();
    }

    return this.giftsRepository.remove(gift);
  }

  async removeMany(ids: number[]) {
    const gifts = await this.giftsRepository.find({
      where: {
        id: In(ids),
      },
    });

    return this.giftsRepository.remove(gifts);
  }
}
