import { Controller, Get, Query } from "@nestjs/common"
import { Public } from "src/auth/decorators/public.decorator"
import { McrateService } from "./mcrate.service"

@Controller('monitorings/mcrate')
export class McrateController {
  constructor (private mcrateService: McrateService) {}

  @Public()
  @Get()
  handler(@Query() body) {
    return this.mcrateService.handler(body)
  }
}