import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserInput } from './dto/user.input';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserProtectedDto } from './dto/user-protected.dto';
import { UserDto } from './dto/user.dto';
import { UserUpdateInput } from './dto/user-update.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { DeleteManyInput } from '@common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Создать одного пользователя' })
  @Post()
  async create(@CurrentUser() actor: User, @Body() createUserDto: UserInput) {
    return new UserDto(await this.usersService.create(createUserDto, actor))
  }

  @ApiOperation({ summary: 'Найти всех пользователей' })
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<PaginatedUsersDto> {
    return new PaginatedUsersDto(await this.usersService.findAll(query));
  }

  @ApiOperation({ summary: 'Найти одного пользователя' })
  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    const user = await this.usersService.getById(uuid)
    if (!user) throw new NotFoundException()

    return new UserDto(user)
  }

  @ApiOperation({ summary: 'Обновить одного пользователя' })
  @Patch(':uuid')
  async update(@CurrentUser() actor: User, @Param('uuid') uuid: string, @Body() updateUserDto: UserUpdateInput) {
    return new UserDto(await this.usersService.update(uuid, updateUserDto, actor))
  }

  @ApiOperation({ summary: 'Удалить одного пользователя' })
  @Delete(':uuid')
  async remove(@CurrentUser() actor: User, @Param('uuid') uuid: string) {
    return new UserDto(await this.usersService.delete(uuid, actor))
  }

  @ApiOperation({ summary: 'Удалить несколько пользователей' })
  @Delete('bulk/:ids')
  removeMany(@CurrentUser() actor: User, @Body() body: DeleteManyInput) {
    return this.usersService.deleteMany(body, actor)
  }

  @Public()
  @ApiOperation({ summary: 'Количество пользователей' })
  @Get('count')
  count(): Promise<number> {
    return this.usersService.count();
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
    return this.usersService.getPublicUser(username)
  }

  @Public()
  @Get('public/users')
  async getAllUsers() {
    return this.usersService.getAllUsers()
  }
}
