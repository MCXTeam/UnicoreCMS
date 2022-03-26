import { Controller, Get, Query } from "@nestjs/common"
import { Public } from "src/auth/decorators/public.decorator"
import { MctopService } from "./mctop.service"

@Controller('monitorings/mctop')
export class MctopController {
  constructor (private mctopService: MctopService) {}

  @Public()
  @Get()
  handler(@Query() body) {
    return this.mctopService.handler(body)
  }
}