import { Body, Controller, DefaultValuePipe, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserInput } from './dto/user.input';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserProtectedDto } from './dto/user-protected.dto';
import { UserBasicDto, UserDto } from './dto/user.dto';
import { UserUpdateInput } from './dto/user-update.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { DeleteManyUuidInput, THROTTLE_PUBLIC_USERS } from '@common';
import { PasswordUpdateInput } from 'src/game/cabinet/settings/dto/password-update.input';
import { Permissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { Permission, UserField, USER_FIELDS, USER_FIELD_PERMISSIONS } from 'unicore-common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  private async allowedFields(request: any): Promise<UserField[]> {
    const checked = await Promise.all(
      USER_FIELDS.map(async (field) => ((await matchPermission([USER_FIELD_PERMISSIONS[field]], request)) ? field : null)),
    );

    return checked.filter(Boolean) as UserField[];
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersCreate])
  @ApiOperation({ summary: 'Создать одного пользователя' })
  @Post()
  async create(@Req() request: any, @CurrentUser() actor: User, @Body() createUserDto: UserInput) {
    return new UserDto(await this.usersService.create(createUserDto, actor, await this.allowedFields(request)));
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersRead])
  @ApiOperation({ summary: 'Найти всех пользователей' })
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<PaginatedUsersDto> {
    return new PaginatedUsersDto(await this.usersService.findAll(query));
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersDeleteMany])
  @ApiOperation({ summary: 'Удалить несколько пользователей' })
  @Delete('bulk')
  removeMany(@CurrentUser() actor: User, @Body() body: DeleteManyUuidInput) {
    return this.usersService.deleteMany(body, actor);
  }

  @Public()
  @ApiOperation({ summary: 'Количество пользователей' })
  @Get('count')
  count(): Promise<number> {
    return this.usersService.count();
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersRead])
  @ApiOperation({ summary: 'Найти одного пользователя' })
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    const user = await this.usersService.getById(uuid);
    if (!user) throw new NotFoundException();

    return new UserBasicDto(user);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersUpdate])
  @ApiOperation({ summary: 'Обновить одного пользователя' })
  @Patch(':uuid')
  async update(@Req() request: any, @CurrentUser() actor: User, @Param('uuid') uuid: string, @Body() updateUserDto: UserUpdateInput) {
    return new UserDto(await this.usersService.update(uuid, updateUserDto, actor, await this.allowedFields(request)));
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersUpdatePassword])
  @Patch(':uuid/password')
  async updatePassword(@CurrentUser() actor: User, @Param('uuid') uuid: string, @Body() body: PasswordUpdateInput) {
    return this.usersService.updatePassord(uuid, body, actor);
  }

  @Permissions([Permission.AdminDashboard, Permission.AdminUsersDelete])
  @ApiOperation({ summary: 'Удалить одного пользователя' })
  @Delete(':uuid')
  async remove(@CurrentUser() actor: User, @Param('uuid') uuid: string) {
    return new UserDto(await this.usersService.delete(uuid, actor));
  }

  @Public()
  @Get('public/uuid/:uuid')
  async getUserByUUID(@Param('uuid') uuid: string): Promise<UserProtectedDto> {
    const user = await this.usersService.getById(uuid);

    if (!user) throw new NotFoundException();

    return new UserProtectedDto(user);
  }

  @Public()
  @Get('public/username/:username')
  async getUserByUsername(@Param('username') username: string): Promise<UserProtectedDto> {
    const user = await this.usersService.getByUsername(username);

    if (!user) throw new NotFoundException();

    return new UserProtectedDto(user);
  }

  @Public()
  @Get('public/user/:username')
  async getPublicUser(@Param('username') username: string) {
    return this.usersService.getPublicUser(username);
  }

  @Public()
  @Throttle({ default: THROTTLE_PUBLIC_USERS })
  @Get('public/users')
  async getAllUsers(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.usersService.getAllUsers(page);
  }
}
