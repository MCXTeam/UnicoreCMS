import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { ServersService } from 'src/game/servers/servers.service';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { WarehouseItem } from '../warehouse/entities/warehouse-item.entity';
import { CartItem } from './entities/cart-item.entity';
import * as _ from 'lodash';
import { CartItemKit } from './entities/cart-item-kit.entity';
import { CartInput } from './dto/cart.input.dto';
import { PayloadType } from '../dto/paginated-store.dto';
import { Kit } from '../entities/kit.entity';
import { CartItemKitProtected, CartItemProtected, CartProtected, CartUnprotect } from './dto/cart.dto';
import { HistoryService } from 'src/game/cabinet/history/history.service';
import { HistoryType } from 'src/game/cabinet/history/enums/history-type.enum';
import { GiveProductInput } from './dto/give-product.input';
import { GiveKitInput } from './dto/give-kit.input';
import { CartBuyInput } from './dto/cart-buy.input';
import { ConfigService } from 'src/admin/config/config.service';
import { ConfigField } from 'src/admin/config/config.enum';
import { CartFindDto } from './dto/cart-find.dto';

@Injectable()
export class CartService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(CartItem)
    private cartItemsRepository: Repository<CartItem>,
    @InjectRepository(CartItemKit)
    private cartItemKitsRepository: Repository<CartItemKit>,
    @InjectRepository(WarehouseItem)
    private warehouseItemsRepository: Repository<WarehouseItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Kit)
    private kitsRepository: Repository<Kit>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private serversService: ServersService,
    private historyService: HistoryService,
  ) { }

  private priceCalc(cartItems, cartKitItems): number {
    return _.sum([
      ...cartItems.map((cartItem) => (cartItem.product.price - (cartItem.product.price * cartItem.product.sale) / 100) * cartItem.amount),
      ...cartKitItems.map((cartItem) => cartItem.kit.price - (cartItem.kit.price * cartItem.kit.sale) / 100),
    ]);
  }

  private async virtualSaleCalulate(cartItems: CartItem[], cartKitItems: CartItemKit[], user: User, price: number): Promise<number> {
    if (user.virtual == 0) 
      return 0

    const cfg = await this.configService.load()
    const allowed_sale = _.sum([
      ...cfg[ConfigField.StoreProductsVirtualUse] ? cartItems.filter(cartKitItems => !cartKitItems.product.prevent_use_virtual).map((cartItem) => (cartItem.product.price - (cartItem.product.price * cartItem.product.sale) / 100) * cartItem.amount) : [],
      ...cfg[ConfigField.StoreKitsVirtualUse] ? cartKitItems.filter(cartKitItems => !cartKitItems.kit.prevent_use_virtual).map((cartItem) => cartItem.kit.price - (cartItem.kit.price * cartItem.kit.sale) / 100) : [],
    ]);
    const max_allowed_sale = price / 100 * Number(cfg[ConfigField.VirtualPercent])

    if (allowed_sale == 0) 
      return 0

    const virtual_sale = allowed_sale <= max_allowed_sale ? allowed_sale : max_allowed_sale

    if (user.virtual < virtual_sale)
      return user.virtual

    return virtual_sale
  }

  private resolver(repo: Repository<WarehouseItem | CartItem>, server: Server, user: User, product: Product) {
    return repo.findOne({ server, user, product });
  }

  private async warehousePusher(user: User, cartItems: CartItem[]) {
    return await Promise.all(
      cartItems.map(async (cartItem) => {
        let warehouseItem = (await this.resolver(this.warehouseItemsRepository, cartItem.server, user, cartItem.product)) as WarehouseItem;

        if (warehouseItem) {
          warehouseItem.amount += cartItem.amount;
        } else {
          warehouseItem = new WarehouseItem();

          warehouseItem.product = cartItem.product;
          warehouseItem.server = cartItem.server;
          warehouseItem.user = user;
          warehouseItem.amount = cartItem.amount;
        }

        return warehouseItem;
      }),
    );
  }

  async find(user: User) {
    return this.cartItemsRepository.find({ user });
  }

  async findByServer(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id);

    if (!server) throw new BadRequestException();

    const products = await this.cartItemsRepository.find({ user, server });
    const kits = await this.cartItemKitsRepository.find({ user, server });
    const price = this.priceCalc(products, kits)

    return new CartFindDto({
      items: [
        ...kits.map((payload) => ({ type: PayloadType.Kit, payload })), 
        ...products.map((payload) => ({ type: PayloadType.Product, payload }))
      ],
      price, virtual_sale: await this.virtualSaleCalulate(products, kits, user, price)
    })
  }

  async add(user: User, body: CartInput) {
    const server = await this.serversService.findOne(body.server_id);

    if (body.type == PayloadType.Product) {
      const product = await this.productsRepository.findOne(body.id, { relations: ['servers'] });

      if (!product || !server || !product.servers.find((srv) => srv.id == server.id)) throw new BadRequestException();

      let cartItem = (await this.resolver(this.cartItemsRepository, server, user, product)) as CartItem;

      if (cartItem) {
        cartItem.amount += body.amount;
      } else {
        cartItem = new CartItem();

        cartItem.product = product;
        cartItem.server = server;
        cartItem.user = user;
        cartItem.amount = body.amount;
      }

      return this.cartItemsRepository.save(cartItem);
    } else {
      const kit = await this.kitsRepository.findOne(body.id, { relations: ['servers'] });

      if (!kit || !server || !kit.servers.find((srv) => srv.id == server.id)) throw new BadRequestException();

      const cartKitItem = new CartItemKit();

      cartKitItem.kit = kit;
      cartKitItem.server = server;
      cartKitItem.user = user;

      return this.cartItemKitsRepository.save(cartKitItem);
    }
  }

  async clearOwn(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id);

    if (!server) throw new BadRequestException();

    const cartItems = await this.cartItemsRepository.find({ user, server });
    const cartKitItems = await this.cartItemKitsRepository.find({ user, server });

    return [
      ...(await this.cartItemKitsRepository.remove(cartKitItems)).map((payload) => ({ type: PayloadType.Kit, payload })),
      ...(await this.cartItemsRepository.remove(cartItems)).map((payload) => ({ type: PayloadType.Product, payload })),
    ].map((val) => new CartProtected(val));
  }

  async clear(user_uuid: string) {
    const user = await this.usersRepository.findOne(user_uuid);
    const cartItems = await this.cartItemsRepository.find({ user });
    const cartKitItems = await this.cartItemKitsRepository.find({ user });

    if (!user) throw new BadRequestException();

    return [
      ...(await this.cartItemKitsRepository.remove(cartKitItems)).map((payload) => ({ type: PayloadType.Kit, payload })),
      ...(await this.cartItemsRepository.remove(cartItems)).map((payload) => ({ type: PayloadType.Product, payload })),
    ].map((val) => new CartProtected(val));
  }

  async removeOwn(user: User, type: PayloadType, id: number) {
    if (type == PayloadType.Product) {
      const cartItem = await this.cartItemsRepository.findOne({ user, id });
      return new CartItemProtected(await this.cartItemsRepository.remove(cartItem));
    } else {
      const cartItemKit = await this.cartItemKitsRepository.findOne({ user, id });
      return new CartItemKitProtected(await this.cartItemKitsRepository.remove(cartItemKit));
    }
  }

  async remove(id: number) {
    const cartItem = await this.cartItemsRepository.findOne(id);

    return this.cartItemsRepository.remove(cartItem);
  }

  async giveItem(user: User, product: Product, server: Server, amount: number) {
    const virtualItem = new CartItem();
    virtualItem.product = product;
    virtualItem.amount = amount;
    virtualItem.server = server;
    virtualItem.user = user;

    return (await this.warehouseItemsRepository.save(await this.warehousePusher(user, [virtualItem])))[0]
  }

  async giveProductByDTO(input: GiveProductInput) {
    const user = await this.usersRepository.findOne(input.user_uuid)
    const server = await this.serversService.findOne(input.server_id)
    const product = await this.productsRepository.findOne(input.product_id)

    if (!user || !server || !product)
      throw new NotFoundException()

    await this.giveItem(user, product, server, input.amount)
  }

  async giveKit(user: User, server: Server, kit: Kit | number) {
    const warehouseItems: WarehouseItem[] = []

    if (typeof kit === "number") {
      kit = await this.kitsRepository.findOne(kit, { relations: ['items'] })

      if (!kit)
        return false
    }

    const pusherTask = kit.items.map((item) => {
      const virtualItem = new CartItem();
      virtualItem.product = item.product;
      virtualItem.amount = item.amount;
      virtualItem.server = server;
      virtualItem.user = user;

      return virtualItem;
    })

    for (const cik of pusherTask) {
      warehouseItems.push((await this.warehouseItemsRepository.save(await this.warehousePusher(user, [cik])))[0]);
    }

    return warehouseItems
  }

  async giveKitByDTO(input: GiveKitInput) {
    const user = await this.usersRepository.findOne(input.user_uuid)
    const server = await this.serversService.findOne(input.server_id)
    const kit = await this.kitsRepository.findOne(input.kit_id, { relations: ['items'] })

    if (!user || !server || !kit)
      throw new NotFoundException()

    await this.giveKit(user, server, kit)
  }

  async buy(user: User, ip: string, body: CartBuyInput) {
    
    const server = await this.serversService.findOne(body.server_id);

    if (!server) throw new BadRequestException();

    const cartItems = await this.cartItemsRepository.find({ where: { user, server }, relations: ['server', 'product'] });
    const cartKitItems = await this.cartItemKitsRepository.find({ where: { user, server }, relations: ['server', 'kit', 'kit.items'] });

    const price = this.priceCalc(cartItems, cartKitItems)
    let virtual_sale = 0;

    if (body.use_virtual)
      virtual_sale = await this.virtualSaleCalulate(cartItems, cartKitItems, user, price);

    const cartItemsKits = cartKitItems
      .map((cartItem) =>
        cartItem.kit.items.map((item) => {
          const virtualItem = new CartItem();
          virtualItem.product = item.product;
          virtualItem.amount = item.amount;
          virtualItem.server = cartItem.server;
          virtualItem.user = cartItem.user;

          return virtualItem;
        }),
      )
      .flat();

    if (user.real < price - virtual_sale) throw new BadRequestException();

    const warehouseItems = await this.warehouseItemsRepository.save(await this.warehousePusher(user, cartItems));

    for (const cik of cartItemsKits) {
      warehouseItems.push((await this.warehouseItemsRepository.save(await this.warehousePusher(user, [cik])))[0]);
    }

    user.real -= price - virtual_sale;
    user.virtual -= virtual_sale

    for (const ci of cartItems) {
      await this.historyService.create(HistoryType.ProductPurchase, ip, user, ci.product, ci.server, ci.amount);
    }

    for (const cik of cartKitItems) {
      await this.historyService.create(HistoryType.KitPurchase, ip, user, cik.kit, cik.server);
    }

    await this.usersRepository.save(user);
    await this.cartItemsRepository.remove(cartItems);
    await this.cartItemKitsRepository.remove(cartKitItems);
    return warehouseItems.map((wi) => new CartItemProtected(wi));
  }
}
