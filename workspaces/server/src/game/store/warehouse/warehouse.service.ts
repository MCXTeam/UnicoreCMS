import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { UsersService } from 'src/admin/users/users.service';
import { ServersService } from 'src/game/servers/servers.service';
import { In, Not, Repository } from 'typeorm';
import { CartItemProtected } from '../cart/dto/cart.dto';
import { WarehouseGivedInput } from './dto/warehouse-gived.input';
import { WarehouseItem } from './entities/warehouse-item.entity';
import _ from 'lodash';
import { Transactional } from 'typeorm-transactional';

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

    return this.warehouseItemsRepository.findBy({ user: { uuid: user.uuid }, server: { id: server.id } });
  }

  async findFilledServers(user: User): Promise<string[]> {
    const items = await this.warehouseItemsRepository.find({ where: { user: { uuid: user.uuid } }, relations: ['server'] });

    return _.uniq(items.map((item) => item.server?.id).filter(Boolean));
  }

  async findOwn(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id);

    if (!server) throw new BadRequestException();

    return (await this.warehouseItemsRepository.findBy({ user: { uuid: user.uuid }, server: { id: server.id } })).map(
      (wi) => new CartItemProtected(wi),
    );
  }

  async take(id: number) {
    const item = await this.warehouseItemsRepository.findOneBy({ id });
    if (!item) throw new NotFoundException();
    await this.warehouseItemsRepository.remove(item);
    return true;
  }

  @Transactional()
  async afterGive(input: WarehouseGivedInput[]) {
    const givedItems = await this.warehouseItemsRepository.findBy({ id: In(input.map((it) => it.id)) });

    for (const item of givedItems) {
      const gived = input.find((it) => it.id == item.id);

      if (!gived) continue;

      if (item.amount - gived.amount <= 0) {
        await this.warehouseItemsRepository.remove(item);
        continue;
      }

      const decrement = await this.warehouseItemsRepository
        .createQueryBuilder()
        .update()
        .set({ amount: () => 'amount - :amount' })
        .where('id = :id AND amount > :amount', { id: item.id, amount: gived.amount })
        .execute();

      if (!decrement.affected) await this.warehouseItemsRepository.delete({ id: item.id });
    }
  }
}
