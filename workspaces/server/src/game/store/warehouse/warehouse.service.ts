import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { ServersService } from 'src/game/servers/servers.service';
import { In, Not, Repository } from 'typeorm';
import { CartItemProtected } from '../cart/dto/cart.dto';
import { WarehouseGivedInput } from './dto/warehouse-gived.input';
import { WarehouseItem } from './entities/warehouse-item.entity';
import * as _ from 'lodash';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseItem)
    private warehouseItemsRepository: Repository<WarehouseItem>,
    private serversService: ServersService,
    private usersService: UsersService,
  ) {}

  async find(user_id: string, server_id: string) {
    const user = await this.usersService.getById(user_id);
    const server = await this.serversService.findOne(server_id);

    if (!server || !user) throw new BadRequestException();

    return this.warehouseItemsRepository.find({ user, server })
  }

  async findOwn(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id);

    if (!server) throw new BadRequestException();

    return (await this.warehouseItemsRepository.find({ user, server })).map((wi) => new CartItemProtected(wi));
  }

  async take(id: number) {
    const item = await this.warehouseItemsRepository.findOne(id);
    if (!item) throw new NotFoundException();
    await this.warehouseItemsRepository.remove(item)
    return true;
  }

  async afterGive(input: WarehouseGivedInput[]) {
    const givedItems = await this.warehouseItemsRepository.findByIds(input.map(it => it.id));

    for (const i in givedItems) {
      const inputItem = input.find(it => it.id == givedItems[i].id)
      givedItems[i].amount -= inputItem.amount
    }

    await this.warehouseItemsRepository.save(givedItems)
    await this.warehouseItemsRepository.delete(givedItems.filter(it => it.amount <= 0).map(it => it.id)) 
  }
}
