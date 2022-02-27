import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BonusesController } from "./bonuses.controller";
import { BonusesService } from "./bonuses.service";
import { Bonus } from "./entities/bonus.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Bonus])],
  providers: [BonusesService],
  controllers: [BonusesController]
})
export class BonusesModule {}