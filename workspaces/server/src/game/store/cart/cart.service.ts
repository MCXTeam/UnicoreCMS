import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { WarehouseItem } from '../warehouse/entities/warehouse-item.entity';
import { CartItem } from './entities/cart-item.entity';
import * as _ from "lodash"

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(WarehouseItem)
    private warehouseItemsRepository: Repository<WarehouseItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private serversService: ServersService
  ) { }

  resolver(repo: Repository<WarehouseItem | CartItem>, server: Server, user: User, product: Product) {
    return repo.findOne({ server, user, product })
  }

  async find(user: User) {
    return this.cartItemsRepository.find({ user })
  }

  async findByServer(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id)

    if (!server)
      throw new BadRequestException()

    return this.cartItemsRepository.find({ user, server })
  }

  async add(user: User, product_id: number, server_id: string, amount: number) {
    const server = await this.serversService.findOne(server_id)
    const product = await this.productsRepository.findOne(product_id, { relations: ["servers"] })

    if (!product || !server || !product.servers.find(srv => srv.id == server.id))
      throw new BadRequestException()

    let cartItem = await this.resolver(this.cartItemsRepository, server, user, product) as CartItem

    if (cartItem) {
      cartItem.amount += amount
    } else {
      cartItem = new CartItem()

      cartItem.product = product
      cartItem.server = server
      cartItem.user = user
      cartItem.amount = amount
    }

    return this.cartItemsRepository.save(cartItem)
  }

  async clearOwn(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id)

    if (!server)
      throw new BadRequestException()

    const cartItems = await this.cartItemsRepository.find({ user, server })

    return this.cartItemsRepository.remove(cartItems)
  }

  async clear(user_uuid: string) {
    const user = await this.usersRepository.findOne(user_uuid)
    const cartItems = await this.cartItemsRepository.find({ user })

    if (!user || !cartItems)
      throw new BadRequestException()

    return this.cartItemsRepository.remove(cartItems)
  }

  async removeOwn(user: User, id: number) {
    const cartItem = await this.cartItemsRepository.findOne({ user, id })

    return this.cartItemsRepository.remove(cartItem)
  }

  async remove(id: number) {
    const cartItem = await this.cartItemsRepository.findOne(id)

    return this.cartItemsRepository.remove(cartItem)
  }

  async buy(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id)

    if (!server)
      throw new BadRequestException()

    const cartItems = await this.cartItemsRepository.find({ where: { user, server }, relations: ["server", "product"] })
    const price = _.sum(cartItems.map(cartItem => (cartItem.product.price - cartItem.product.price * cartItem.product.sale / 100) * cartItem.amount))

    if (user.real < price)
      throw new BadRequestException()

    let warehouseItems = await Promise.all(cartItems.map(async cartItem => {
      let warehouseItem = await this.resolver(this.warehouseItemsRepository, cartItem.server, user, cartItem.product) as WarehouseItem

      if (warehouseItem) {
        warehouseItem.amount += cartItem.amount
      } else {
        warehouseItem = new WarehouseItem()

        warehouseItem.product = cartItem.product
        warehouseItem.server = cartItem.server
        warehouseItem.user = user
        warehouseItem.amount = cartItem.amount
      }

      return warehouseItem
    }))

    user.real = user.real - price

    await this.usersRepository.save(user)
    await this.cartItemsRepository.remove(cartItems)
    return this.warehouseItemsRepository.save(warehouseItems)
  }
}
