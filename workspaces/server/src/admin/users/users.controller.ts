import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PasswordPolicyService } from 'src/auth/password/password-policy.service';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserInput } from './dto/user.input';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserProtectedDto } from './dto/user-protected.dto';
import { UserBasicDto, UserDto } from './dto/user.dto';
import { UserUpdateInput } from './dto/user-update.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { Audit, DeleteManyUuidInput, Paginate, PaginateQuery, THROTTLE_PUBLIC_USERS, Throttle } from '@common';
import { PasswordUpdateInput } from 'src/game/cabinet/settings/dto/password-update.input';
import { Permissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { UserField, USER_FIELDS, USER_FIELD_PERMISSIONS } from 'unicore-common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private passwordPolicy: PasswordPolicyService,
  ) {}

  private async allowedFields(request: any): Promise<UserField[]> {
    const checked = await Promise.all(
      USER_FIELDS.map(async (field) => ((await matchPermission([USER_FIELD_PERMISSIONS[field]], request)) ? field : null)),
    );

    return checked.filter(Boolean) as UserField[];
  }

  @Permissions(['panel.access', 'panel.users.create'])
  @ApiOperation({ summary: 'Создать одного пользователя' })
  @Post()
  async create(@Req() request: any, @CurrentUser() actor: User, @Body() createUserDto: UserInput) {
    await this.passwordPolicy.assert(createUserDto.password, { username: createUserDto.username, email: createUserDto.email });

    return new UserDto(await this.usersService.create(createUserDto, actor, await this.allowedFields(request), false, request));
  }

  @Permissions(['panel.access', 'panel.users.read'])
  @ApiOperation({ summary: 'Найти всех пользователей' })
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<PaginatedUsersDto> {
    return new PaginatedUsersDto(await this.usersService.findAll(query));
  }

  @Permissions(['panel.access', 'panel.users.delete.many'])
  @ApiOperation({ summary: 'Удалить несколько пользователей' })
  @Delete('bulk')
  removeMany(@Req() request: any, @CurrentUser() actor: User, @Body() body: DeleteManyUuidInput) {
    return this.usersService.deleteMany(body, actor, request);
  }

  @Public()
  @ApiOperation({ summary: 'Количество пользователей' })
  @Get('count')
  count(): Promise<number> {
    return this.usersService.count();
  }

  @Permissions(['panel.access', 'panel.users.read'])
  @ApiOperation({ summary: 'Найти одного пользователя' })
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return new UserBasicDto(user);
  }

  @Permissions(['panel.access', 'panel.users.update'])
  @ApiOperation({ summary: 'Обновить одного пользователя' })
  @Patch(':uuid')
  async update(@Req() request: any, @CurrentUser() actor: User, @Param('uuid') uuid: string, @Body() updateUserDto: UserUpdateInput) {
    return new UserDto(await this.usersService.update(uuid, updateUserDto, actor, await this.allowedFields(request), request));
  }

  @Permissions(['panel.access', 'panel.users.field.password'])
  @Audit({ action: 'auth.password.change', target: 'user', param: 'uuid' })
  @Patch(':uuid/password')
  async updatePassword(@CurrentUser() actor: User, @Param('uuid') uuid: string, @Body() body: PasswordUpdateInput) {
    return this.usersService.updatePassord(uuid, body, actor);
  }

  @Permissions(['panel.access', 'panel.users.twofactor.reset'])
  @ApiOperation({ summary: 'Сбросить двухфакторную проверку' })
  @Audit({ action: 'auth.twofactor.reset', target: 'user', param: 'uuid' })
  @Delete(':uuid/2fa')
  async resetTwoFactor(@CurrentUser() actor: User, @Param('uuid') uuid: string) {
    return this.usersService.resetTwoFactor(uuid, actor);
  }

  @Permissions(['panel.access', 'panel.users.sessions.revoke'])
  @ApiOperation({ summary: 'Завершить все сеансы игрока' })
  @Audit({ action: 'auth.session.revoke.all', target: 'user', param: 'uuid' })
  @Delete(':uuid/sessions')
  async closeSessions(@CurrentUser() actor: User, @Param('uuid') uuid: string) {
    return this.usersService.closeSessions(uuid, actor);
  }

  @Permissions(['panel.access', 'panel.users.delete'])
  @ApiOperation({ summary: 'Удалить одного пользователя' })
  @Delete(':uuid')
  async remove(@Req() request: any, @CurrentUser() actor: User, @Param('uuid') uuid: string) {
    return new UserDto(await this.usersService.delete(uuid, actor, request));
  }

  @Public()
  @Get('public/uuid/:uuid')
  async getUserByUUID(@Param('uuid') uuid: string): Promise<UserProtectedDto> {
    const user = await this.usersService.getById(uuid, ['roles']);

    if (!user) throw new NotFoundException();

    return new UserProtectedDto(user);
  }

  @Public()
  @Get('public/username/:username')
  async getUserByUsername(@Param('username') username: string): Promise<UserProtectedDto> {
    const user = await this.usersService.getByUsername(username, ['roles']);

    if (!user) throw new NotFoundException();

    return new UserProtectedDto(user);
  }

  @Public()
  @Get('public/user/:username')
  async getPublicUser(@Param('username') username: string) {
    return this.usersService.getPublicUser(username);
  }

  @Public()
  @Throttle(THROTTLE_PUBLIC_USERS)
  @Get('public/users')
  async getAllUsers(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.usersService.getAllUsers(page);
  }
}
