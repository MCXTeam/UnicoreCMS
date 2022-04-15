import { Exclude } from "class-transformer";
import { Server } from "../entities/server.entity";
import { RCON } from "../rcon/entities/rcon.entity";

export class ServerProtectedDto {
    @Exclude()
    rcon: RCON;
  
    constructor(partial: Partial<Server>) {
      Object.assign(this, partial);
    }
  }