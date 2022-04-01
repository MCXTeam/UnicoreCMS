import { Body, Controller, Get, Post, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { Permission } from 'unicore-common';
import { Permissions } from './decorators/permission.decorator';
import { RoleCreateInput } from './dto/role-create.input';
import { RoleUpdateInput } from './dto/role-update.input';
import { Role } from './entities/role.entity';
import { SuperUserGuard } from './guards/superuser.guard';
import { RolesService } from './roles.service';

@Controller('admin/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Permissions([Permission.AdminDashboard])
  @Get()
  findAll(): Promise<Role[]> {
    return this.rolesService.find();
  }

  @Permissions([Permission.AdminDashboard])
  @Get('autocompleate')
  findAutoCompleate(): Promise<string[]> {
    return this.rolesService.findAutoCompleate();
  }

  @UseGuards(SuperUserGuard)
  @Post()
  create(@Body() body: RoleCreateInput) {
    return this.rolesService.create(body);
  }

  @UseGuards(SuperUserGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: RoleUpdateInput) {
    return this.rolesService.update(id, body);
  }

  @UseGuards(SuperUserGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
