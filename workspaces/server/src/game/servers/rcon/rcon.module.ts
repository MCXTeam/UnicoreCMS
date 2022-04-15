import { Module, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Server } from "../entities/server.entity";
import { RconService } from "./rcon.service";

@Module({
    imports: [TypeOrmModule.forFeature([Server])],
    providers: [RconService]
})
export class RconModule implements OnModuleInit {
    constructor (private rconService: RconService) {}

    onModuleInit() {
        this.rconService.init()
    }
}