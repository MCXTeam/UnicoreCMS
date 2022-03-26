import { Body, Controller, Post } from "@nestjs/common"
import { Public } from "src/auth/decorators/public.decorator"
import { MinecraftRatingService } from "./minecraftrating.service"

@Controller('monitorings/minecraftrating')
export class MinecraftRatingController {
  constructor (private mrService: MinecraftRatingService) {}

  @Public()
  @Post()
  handler(@Body() body) {
    return this.mrService.handler(body)
  }
}