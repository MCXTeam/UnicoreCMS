import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Server } from "../../entities/server.entity";

@Entity({ name: "unicore_rcons" })
export class RCON {
    @Column({ name: "host" })
    host: string;

    @Column({ name: "port" })
    port: number;

    @Column({ name: "password" })
    password: string;

    @OneToOne(() => Server, (server) => server.rcon, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primary: true,
    })
    @JoinColumn({ name: "server_id" })
    server: Server;
}