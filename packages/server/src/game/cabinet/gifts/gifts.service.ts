import { MomentWrapper } from '@common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { In, Repository } from 'typeorm';
import { GiftInput } from './dto/gift.input';
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
  ) { }

  find(): Promise<Gift[]> {
    const qb = this.giftsRepository.createQueryBuilder('gift')
      .loadRelationCountAndMap('gift.activations', 'gift.activations')
      .getMany()

    return qb;
  }

  findOne(id: number, relations?: string[]): Promise<Gift> {
    return this.giftsRepository.findOne(id, { relations });
  }

  async create(input: GiftInput) {
    const gift = new Gift();

    gift.promocode = input.promocode
    gift.type = input.type
    gift.max_activations = input.max_activations
    gift.expires = this.moment(input.expires).utc().toDate()

    gift.product = null
    gift.kit = null
    gift.donate_group = null
    gift.donate_permission = null
    gift.server = null
    gift.period = null
    gift.amount = null

    switch (input.type) {
      case GiftType.Product:
        gift.amount = input.amount
        gift.product = await this.productsRepository.findOneOrFail(input.product)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Kit:
        gift.kit = await this.kitsRepository.findOneOrFail(input.kit)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Donate:
        gift.donate_group = await this.donateGroupsRepository.findOneOrFail(input.donate_group)
        gift.period = await this.periodsRepository.findOneOrFail(input.period)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Permission:
        gift.donate_permission = await this.donatePermissionsRepository.findOneOrFail(input.donate_permission)
        gift.period = await this.periodsRepository.findOneOrFail(input.period)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Money:
        gift.amount = input.amount
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Real:
        gift.amount = input.amount
        break;
    }

    return this.giftsRepository.save(gift);
  }

  async update(id: number, input: GiftInput) {
    const gift = await this.findOne(id);

    if (!gift) {
      throw new NotFoundException();
    }

    gift.promocode = input.promocode
    gift.type = input.type
    gift.max_activations = input.max_activations
    gift.expires = this.moment(input.expires).utc().toDate()

    gift.product = null
    gift.kit = null
    gift.donate_group = null
    gift.donate_permission = null
    gift.server = null
    gift.period = null
    gift.amount = null

    switch (input.type) {
      case GiftType.Product:
        gift.amount = input.amount
        gift.product = await this.productsRepository.findOneOrFail(input.product)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Kit:
        gift.kit = await this.kitsRepository.findOneOrFail(input.kit)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Donate:
        gift.donate_group = await this.donateGroupsRepository.findOneOrFail(input.donate_group)
        gift.period = await this.periodsRepository.findOneOrFail(input.period)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Permission:
        gift.donate_permission = await this.donatePermissionsRepository.findOneOrFail(input.donate_permission)
        gift.period = await this.periodsRepository.findOneOrFail(input.period)
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Money:
        gift.amount = input.amount
        gift.server = await this.serversRepository.findOneOrFail(input.server)
        break;
      case GiftType.Real:
        gift.amount = input.amount
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
