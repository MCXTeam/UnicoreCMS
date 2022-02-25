import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BansController } from "./bans.controller";
import { BansService } from "./bans.service";
import { Ban } from "./entities/ban.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Ban])],
  providers: [BansService],
  controllers: [BansController],
})
export class GiftsModule {}