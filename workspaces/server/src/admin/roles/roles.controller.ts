import { Body, Controller, Get, Post, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RoleCreateInput } from './dto/role-create.input';
import { RoleUpdateInput } from './dto/role-update.input';
import { Role } from './entities/role.entity';
import { SuperUserGuard } from './guards/superuser.guard';
import { RolesService } from './roles.service';

@UseGuards(SuperUserGuard)
@Controller('admin/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll(): Promise<Role[]> {
    return this.rolesService.find();
  }

  @Get('autocompleate')
  findAutoCompleate(): Promise<string[]> {
    return this.rolesService.findAutoCompleate();
  }

  @Post()
  create(@Body() body: RoleCreateInput) {
    return this.rolesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: RoleUpdateInput) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
