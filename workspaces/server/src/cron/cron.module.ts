import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from 'src/admin/config/config.module';
import { EmailActivation } from 'src/admin/email/entities/email-activation.entity';
import { PasswordReset } from 'src/admin/email/entities/password-reset.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { History } from 'src/game/cabinet/history/entities/history.entity';
import { PlaytimeModule } from 'src/game/cabinet/playtime/playtime.module';
import { Referal } from 'src/game/cabinet/referals/entities/referal.entity';
import { UsersDonateGroup } from 'src/game/donate/groups/entities/user-donate.entity';
import { UsersDonatePermission } from 'src/game/donate/permissions/entities/user-permission.entity';
import { OnlineModule } from 'src/game/servers/online/online.module';
import { ServersModule } from 'src/game/servers/servers.module';
import { CartItemKit } from 'src/game/store/cart/entities/cart-item-kit.entity';
import { CartItem } from 'src/game/store/cart/entities/cart-item.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { CartTasks } from './tasks/cart.tasks';
import { DonateTasks } from './tasks/donate.tasks';
import { EmailTasks } from './tasks/email.tasks';
import { HistoryTasks } from './tasks/history.tasks';
import { OnlineTasks } from './tasks/online.tasks';
import { PaymentTasks } from './tasks/payment-cleaner.tasks';
import { ReferalsTasks } from './tasks/referals.tasks';
import { TokenTasks } from './tasks/tokens.tasks';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken, History, CartItem, CartItemKit, UsersDonateGroup, UsersDonatePermission, Payment, Referal, User, PasswordReset, EmailActivation]), ServersModule, OnlineModule, ConfigModule, PlaytimeModule],
  providers: [TokenTasks, HistoryTasks, OnlineTasks, CartTasks, DonateTasks, PaymentTasks, ReferalsTasks, HistoryTasks, EmailTasks],
})
export class CronModule { }
