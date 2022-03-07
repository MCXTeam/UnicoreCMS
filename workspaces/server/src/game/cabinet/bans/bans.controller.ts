import { Body, Controller, Delete, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { Permissions } from "src/admin/roles/decorators/permission.decorator";
import { Permission } from "unicore-common";
import { BansService } from "./bans.service";
import { BanDto } from "./dto/ban.dto";
import { BanInput } from "./dto/ban.input";

@Controller('bans')
export class BansController {
  constructor (private bansService: BansService) {}

  @Permissions([Permission.KernelUnicoreConnect])
  @Get(':uuid')
  async findOne(@Param("uuid") uuid: string): Promise<BanDto> {
    const ban = await this.bansService.findOne(uuid)

    if (!ban) 
      throw new NotFoundException()

    return new BanDto(ban)
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Post()
  create(@Body() body: BanInput) {
    return this.bansService.create(body)
  }

  @Permissions([Permission.KernelUnicoreConnect])
  @Delete(':uuid')
  delete(@Param("uuid") uuid: string) {
    return this.bansService.remove(uuid)
  }
}