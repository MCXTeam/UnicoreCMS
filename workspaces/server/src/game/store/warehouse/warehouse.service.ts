import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { ServersService } from 'src/game/servers/servers.service';
import { In, Not, Repository } from 'typeorm';
import { CartItemProtected } from '../cart/dto/cart.dto';
import { WarehouseRejectInput } from './dto/warehouse-reject.input';
import { WarehouseItem } from './entities/warehouse-item.entity';

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

    if (!user) throw new BadRequestException();

    return this.findOwn(user, server_id);
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

  async afterGive(input: WarehouseRejectInput) {
    const user = await this.usersService.getById(input.user_uuid);

    if (!user) throw new BadRequestException();

    const rejectedItems = await this.warehouseItemsRepository.find({ id: Not(In(input.rejected_items)), user });

    return (await this.warehouseItemsRepository.remove(rejectedItems)).map((wi) => new CartItemProtected(wi));
  }
}
