import { Body, Controller, Delete, Get, Param, ParseArrayPipe, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UserInput } from './dto/user.input';

@ApiTags('users')
@Controller('admin/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Создать одного пользователя' })
  @Post()
  create(@Body() createUserDto: UserInput) {}

  @ApiOperation({ summary: 'Найти всех пользователей' })
  @Get()
  async findAll(@Paginate() query: PaginateQuery): Promise<PaginatedUsersDto> {
    return new PaginatedUsersDto(await this.usersService.findAll(query));
  }

  @ApiOperation({ summary: 'Найти одного пользователя' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @ApiOperation({ summary: 'Обновить одного пользователя' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UserInput) {}

  @ApiOperation({ summary: 'Удалить одного пользователя' })
  @Delete(':id')
  remove(@Param('id') id: number) {}

  @ApiOperation({ summary: 'Удалить несколько пользователей' })
  @Delete('bulk/:id')
  removeMany(@Param('id', new ParseArrayPipe({ items: Number })) id: number[]) {}

  @ApiOperation({ summary: 'Количество пользователей' })
  @Get('count')
  count(): Promise<number> {
    return this.usersService.count();
  }
}
