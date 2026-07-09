import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { Server } from 'src/game/servers/entities/server.entity';
import { IssuanceService } from 'src/game/servers/rcon/issuance.service';
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
import { currencyUtils, SystemCurrency } from 'src/common/utils/currencyUtils';
import { Transactional } from 'typeorm-transactional';

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
    private issuanceService: IssuanceService,
  ) {}

  private priceCalc(cartItems, cartKitItems): number {
    return currencyUtils.roundByType(
      _.sum([
        ...cartItems.map((cartItem) => (cartItem.product.price - (cartItem.product.price * cartItem.product.sale) / 100) * cartItem.amount),
        ...cartKitItems.map((cartItem) => cartItem.kit.price - (cartItem.kit.price * cartItem.kit.sale) / 100),
      ]),
      SystemCurrency.REAL,
    );
  }

  private async virtualSaleCalulate(cartItems: CartItem[], cartKitItems: CartItemKit[], user: User, price: number): Promise<number> {
    if (user.virtual == 0) return 0;

    const cfg = await this.configService.load();
    const virtual_sale = _.sum([
      ...(cfg[ConfigField.StoreProductsVirtualUse]
        ? cartItems.map(
            (cartItem) =>
              (((cartItem.product.price - (cartItem.product.price * cartItem.product.sale) / 100) * cartItem.amount) / 100) *
              (cartItem.product.virtual_percent == null ? Number(cfg[ConfigField.VirtualPercent]) : cartItem.product.virtual_percent),
          )
        : []),
      ...(cfg[ConfigField.StoreKitsVirtualUse]
        ? cartKitItems.map(
            (cartItem) =>
              ((cartItem.kit.price - (cartItem.kit.price * cartItem.kit.sale) / 100) / 100) *
              (cartItem.kit.virtual_percent == null ? Number(cfg[ConfigField.VirtualPercent]) : cartItem.kit.virtual_percent),
          )
        : []),
    ]);

    if (user.virtual < virtual_sale) return currencyUtils.roundByType(user.virtual, SystemCurrency.VIRTAUL);

    return currencyUtils.roundByType(virtual_sale, SystemCurrency.VIRTAUL);
  }

  private resolver(repo: Repository<WarehouseItem | CartItem>, server: Server, user: User, product: Product) {
    return repo.findOneBy({ server: { id: server.id }, user: { uuid: user.uuid }, product: { id: product.id } });
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
    return this.cartItemsRepository.findBy({ user: { uuid: user.uuid } });
  }

  async findByServer(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id);

    if (!server) throw new BadRequestException();

    const products = await this.cartItemsRepository.findBy({ user: { uuid: user.uuid }, server: { id: server.id } });
    const kits = await this.cartItemKitsRepository.findBy({ user: { uuid: user.uuid }, server: { id: server.id } });
    const price = this.priceCalc(products, kits);

    return new CartFindDto({
      items: [
        ...kits.map((payload) => ({ type: PayloadType.Kit, payload })),
        ...products.map((payload) => ({ type: PayloadType.Product, payload })),
      ],
      price,
      virtual_sale: await this.virtualSaleCalulate(products, kits, user, price),
    });
  }

  async add(user: User, body: CartInput) {
    const server = await this.serversService.findOne(body.server_id);

    if (body.type == PayloadType.Product) {
      const product = await this.productsRepository.findOne({ where: { id: body.id }, relations: ['servers'] });

      if (!product || !server || !product.servers.find((srv) => srv.id == server.id)) throw new BadRequestException();

      if (product.multiple_of && body.amount % product.multiple_of != 0) throw new BadRequestException();

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

      return new CartItemProtected(await this.cartItemsRepository.save(cartItem));
    } else {
      const kit = await this.kitsRepository.findOne({ where: { id: body.id }, relations: ['servers'] });

      if (!kit || !server || !kit.servers.find((srv) => srv.id == server.id)) throw new BadRequestException();

      const cartKitItem = new CartItemKit();

      cartKitItem.kit = kit;
      cartKitItem.server = server;
      cartKitItem.user = user;

      return new CartItemKitProtected(await this.cartItemKitsRepository.save(cartKitItem));
    }
  }

  async clearOwn(user: User, server_id: string) {
    const server = await this.serversService.findOne(server_id);

    if (!server) throw new BadRequestException();

    const cartItems = await this.cartItemsRepository.findBy({ user: { uuid: user.uuid }, server: { id: server.id } });
    const cartKitItems = await this.cartItemKitsRepository.findBy({ user: { uuid: user.uuid }, server: { id: server.id } });

    return [
      ...(await this.cartItemKitsRepository.remove(cartKitItems)).map((payload) => ({ type: PayloadType.Kit, payload })),
      ...(await this.cartItemsRepository.remove(cartItems)).map((payload) => ({ type: PayloadType.Product, payload })),
    ].map((val) => new CartProtected(val));
  }

  async clear(user_uuid: string) {
    const user = await this.usersRepository.findOneBy({ uuid: user_uuid });

    if (!user) throw new BadRequestException();

    const cartItems = await this.cartItemsRepository.findBy({ user: { uuid: user.uuid } });
    const cartKitItems = await this.cartItemKitsRepository.findBy({ user: { uuid: user.uuid } });

    return [
      ...(await this.cartItemKitsRepository.remove(cartKitItems)).map((payload) => ({ type: PayloadType.Kit, payload })),
      ...(await this.cartItemsRepository.remove(cartItems)).map((payload) => ({ type: PayloadType.Product, payload })),
    ].map((val) => new CartProtected(val));
  }

  async removeOwn(user: User, type: PayloadType, id: number) {
    if (type == PayloadType.Product) {
      const cartItem = await this.cartItemsRepository.findOneBy({ user: { uuid: user.uuid }, id });
      return new CartItemProtected(await this.cartItemsRepository.remove(cartItem));
    } else {
      const cartItemKit = await this.cartItemKitsRepository.findOneBy({ user: { uuid: user.uuid }, id });
      return new CartItemKitProtected(await this.cartItemKitsRepository.remove(cartItemKit));
    }
  }

  async remove(id: number) {
    const cartItem = await this.cartItemsRepository.findOneBy({ id });

    return this.cartItemsRepository.remove(cartItem);
  }

  async giveItem(user: User, product: Product, server: Server, amount: number) {
    if (this.issuanceService.isRcon(server)) {
      await this.issuanceService.deliverProduct(user, server, product, amount);
      return null;
    }

    const virtualItem = new CartItem();
    virtualItem.product = product;
    virtualItem.amount = amount;
    virtualItem.server = server;
    virtualItem.user = user;

    return (await this.warehouseItemsRepository.save(await this.warehousePusher(user, [virtualItem])))[0];
  }

  async giveProductByDTO(input: GiveProductInput) {
    const user = await this.usersRepository.findOneBy({ uuid: input.user_uuid });
    const server = await this.serversService.findOne(input.server_id);
    const product = await this.productsRepository.findOneBy({ id: Number(input.product_id) });

    if (!user || !server || !product) throw new NotFoundException();

    await this.giveItem(user, product, server, input.amount);
  }

  async giveKit(user: User, server: Server, kit: Kit | number) {
    const warehouseItems: WarehouseItem[] = [];

    if (typeof kit === 'number') {
      kit = await this.kitsRepository.findOne({ where: { id: kit }, relations: ['items'] });

      if (!kit) return false;
    }

    const pusherTask = kit.items.map((item) => {
      const virtualItem = new CartItem();
      virtualItem.product = item.product;
      virtualItem.amount = item.amount;
      virtualItem.server = server;
      virtualItem.user = user;

      return virtualItem;
    });

    for (const cik of pusherTask) {
      if (this.issuanceService.isRcon(server)) {
        await this.issuanceService.deliverProduct(user, server, cik.product, cik.amount);
      } else {
        warehouseItems.push((await this.warehouseItemsRepository.save(await this.warehousePusher(user, [cik])))[0]);
      }
    }

    return warehouseItems;
  }

  async giveKitByDTO(input: GiveKitInput) {
    const user = await this.usersRepository.findOneBy({ uuid: input.user_uuid });
    const server = await this.serversService.findOne(input.server_id);
    const kit = await this.kitsRepository.findOne({ where: { id: Number(input.kit_id) }, relations: ['items'] });

    if (!user || !server || !kit) throw new NotFoundException();

    await this.giveKit(user, server, kit);
  }

  @Transactional()
  async buy(user: User, ip: string, body: CartBuyInput) {
    const server = await this.serversService.findOne(body.server_id);

    if (!server) throw new BadRequestException();

    const cartItems = await this.cartItemsRepository.find({
      where: { user: { uuid: user.uuid }, server: { id: server.id } },
      relations: ['server', 'product'],
    });
    const cartKitItems = await this.cartItemKitsRepository.find({
      where: { user: { uuid: user.uuid }, server: { id: server.id } },
      relations: ['server', 'kit', 'kit.items'],
    });

    const price = this.priceCalc(cartItems, cartKitItems);
    let virtual_sale = 0;

    if (body.use_virtual) virtual_sale = await this.virtualSaleCalulate(cartItems, cartKitItems, user, price);

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

    const realCost = currencyUtils.roundByType(price - virtual_sale, SystemCurrency.REAL);
    const virtualCost = currencyUtils.roundByType(virtual_sale, SystemCurrency.VIRTAUL);

    const debit = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ real: () => 'real - :realCost', virtual: () => 'virtual - :virtualCost' })
      .where('uuid = :uuid AND real >= :realCost AND virtual >= :virtualCost', { uuid: user.uuid, realCost, virtualCost })
      .execute();

    if (!debit.affected) throw new BadRequestException();

    user.real -= realCost;
    user.virtual -= virtualCost;

    const warehouseUser = { uuid: user.uuid } as User;

    let warehouseItems: WarehouseItem[];

    try {
      if (this.issuanceService.isRcon(server)) {
        for (const ci of cartItems) {
          await this.issuanceService.deliverProduct(user, server, ci.product, ci.amount);
        }
        for (const cik of cartItemsKits) {
          await this.issuanceService.deliverProduct(user, server, cik.product, cik.amount);
        }
        warehouseItems = [];
      } else {
        warehouseItems = await this.warehouseItemsRepository.save(await this.warehousePusher(warehouseUser, cartItems));

        for (const cik of cartItemsKits) {
          warehouseItems.push((await this.warehouseItemsRepository.save(await this.warehousePusher(warehouseUser, [cik])))[0]);
        }
      }
    } catch (e) {
      await this.usersRepository
        .createQueryBuilder()
        .update(User)
        .set({ real: () => 'real + :realCost', virtual: () => 'virtual + :virtualCost' })
        .where('uuid = :uuid', { uuid: user.uuid, realCost, virtualCost })
        .execute();

      throw e;
    }

    for (const ci of cartItems) {
      await this.historyService.create(HistoryType.ProductPurchase, ip, user, ci.product, ci.server, ci.amount);
    }

    for (const cik of cartKitItems) {
      await this.historyService.create(HistoryType.KitPurchase, ip, user, cik.kit, cik.server);
    }

    await this.cartItemsRepository.remove(cartItems);
    await this.cartItemKitsRepository.remove(cartKitItems);
    return warehouseItems.map((wi) => new CartItemProtected(wi));
  }
}
