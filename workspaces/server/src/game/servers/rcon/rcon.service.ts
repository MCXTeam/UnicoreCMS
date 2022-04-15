import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Server } from "../entities/server.entity";

@Injectable()
export class RconService {
    private connections = new Array()

    constructor (@InjectRepository(Server) private serversRepository: Repository<Server>) {}

    init() {

    }

    private reconnectionHandler() {

    }

    private createConnection() {

    }

    getConnections() {
        
    }

    getConnection() {
        
    }

    sendCommand() {

    }
}